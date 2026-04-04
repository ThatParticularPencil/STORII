use anchor_lang::prelude::*;

declare_id!("ahWw6JRQVTsE5NQoEJC7kXcE5ZYU3KZS6jEU9V7mx15");

// ── Constants ─────────────────────────────────────────────────────────────────

pub const MAX_TITLE_LEN: usize = 128;
pub const MAX_CONTENT_HASH_LEN: usize = 64; // CID or SHA-256 hex
pub const MAX_CREATOR_NOTE_LEN: usize = 512;
pub const MAX_ARWEAVE_URI_LEN: usize = 256;

// ── Program ───────────────────────────────────────────────────────────────────

#[program]
pub mod storylock {
    use super::*;

    /// Creator initialises a new piece of writing.
    /// Stores metadata and the opening paragraph hash on-chain.
    pub fn create_piece(
        ctx: Context<CreatePiece>,
        title: String,
        opening_hash: [u8; 32],
        opening_arweave_uri: String,
    ) -> Result<()> {
        require!(title.len() <= MAX_TITLE_LEN, StoryError::TitleTooLong);
        require!(
            opening_arweave_uri.len() <= MAX_ARWEAVE_URI_LEN,
            StoryError::UriTooLong
        );

        let piece = &mut ctx.accounts.piece;
        piece.creator = ctx.accounts.creator.key();
        piece.title = title;
        piece.status = PieceStatus::Active;
        piece.paragraph_count = 1; // opening paragraph counts as para 0
        piece.round_count = 0;
        piece.created_at = Clock::get()?.unix_timestamp;

        // Record opening paragraph as a sealed entry
        let para = &mut ctx.accounts.opening_paragraph;
        para.piece = piece.key();
        para.index = 0;
        para.content_hash = opening_hash;
        para.arweave_uri = opening_arweave_uri;
        para.author = ctx.accounts.creator.key();
        para.sealed_at = Clock::get()?.unix_timestamp;
        para.vote_count = 0;
        para.is_opening = true;

        emit!(PieceCreated {
            piece: piece.key(),
            creator: piece.creator,
            title: piece.title.clone(),
            created_at: piece.created_at,
        });

        Ok(())
    }

    /// Creator opens a new writing round for a piece.
    pub fn open_round(
        ctx: Context<OpenRound>,
        submission_duration_secs: i64,
        voting_duration_secs: i64,
        max_submissions: u16,
    ) -> Result<()> {
        require!(
            ctx.accounts.piece.status == PieceStatus::Active,
            StoryError::PieceNotActive
        );
        require!(
            ctx.accounts.piece.creator == ctx.accounts.creator.key(),
            StoryError::Unauthorized
        );
        require!(submission_duration_secs > 0, StoryError::InvalidDuration);
        require!(voting_duration_secs > 0, StoryError::InvalidDuration);

        let now = Clock::get()?.unix_timestamp;
        let round = &mut ctx.accounts.round;
        round.piece = ctx.accounts.piece.key();
        round.round_index = ctx.accounts.piece.round_count;
        round.submission_deadline = now + submission_duration_secs;
        round.voting_deadline = now + submission_duration_secs + voting_duration_secs;
        round.status = RoundStatus::Submissions;
        round.winning_submission = None;
        round.total_votes = 0;
        round.submission_count = 0;
        round.max_submissions = max_submissions;
        round.opened_at = now;
        round.creator_note = String::new();

        // Advance piece round counter
        ctx.accounts.piece.round_count += 1;

        emit!(RoundOpened {
            round: round.key(),
            piece: round.piece,
            round_index: round.round_index,
            submission_deadline: round.submission_deadline,
            voting_deadline: round.voting_deadline,
        });

        Ok(())
    }

    /// Grant (or update) a subscriber's tier for a piece.
    pub fn add_subscriber(
        ctx: Context<AddSubscriber>,
        tier: SubscriberTier,
    ) -> Result<()> {
        require!(
            ctx.accounts.piece.creator == ctx.accounts.creator.key(),
            StoryError::Unauthorized
        );

        let sub = &mut ctx.accounts.subscriber_record;
        sub.creator = ctx.accounts.creator.key();
        sub.piece = ctx.accounts.piece.key();
        sub.subscriber = ctx.accounts.subscriber.key();
        sub.tier = tier;
        sub.contribution_tokens = 0;
        sub.vote_tokens = 0;
        sub.added_at = Clock::get()?.unix_timestamp;

        emit!(SubscriberAdded {
            piece: sub.piece,
            subscriber: sub.subscriber,
            tier,
        });

        Ok(())
    }

    /// Remove a subscriber from a piece.
    pub fn remove_subscriber(ctx: Context<RemoveSubscriber>) -> Result<()> {
        require!(
            ctx.accounts.piece.creator == ctx.accounts.creator.key(),
            StoryError::Unauthorized
        );
        // Anchor will close the account and return lamports to creator
        Ok(())
    }

    /// Creator issues a contribution token to a Tier 1 subscriber for the current round.
    /// Called once per eligible subscriber after open_round.
    pub fn issue_contribution_token(ctx: Context<IssueToken>) -> Result<()> {
        require!(
            ctx.accounts.piece.creator == ctx.accounts.creator.key(),
            StoryError::Unauthorized
        );
        require!(
            ctx.accounts.round.status == RoundStatus::Submissions,
            StoryError::WrongRoundState
        );
        require!(
            ctx.accounts.subscriber_record.tier == SubscriberTier::InnerCircle,
            StoryError::WrongTier
        );

        ctx.accounts.subscriber_record.contribution_tokens =
            ctx.accounts.subscriber_record.contribution_tokens.saturating_add(1);

        Ok(())
    }

    /// Creator issues a vote token to a Tier 1 or Tier 2 subscriber for the current round.
    pub fn issue_vote_token(ctx: Context<IssueToken>) -> Result<()> {
        require!(
            ctx.accounts.piece.creator == ctx.accounts.creator.key(),
            StoryError::Unauthorized
        );
        require!(
            ctx.accounts.round.status == RoundStatus::Submissions
                || ctx.accounts.round.status == RoundStatus::Voting,
            StoryError::WrongRoundState
        );
        require!(
            ctx.accounts.subscriber_record.tier == SubscriberTier::InnerCircle
                || ctx.accounts.subscriber_record.tier == SubscriberTier::Community,
            StoryError::WrongTier
        );

        ctx.accounts.subscriber_record.vote_tokens =
            ctx.accounts.subscriber_record.vote_tokens.saturating_add(1);

        Ok(())
    }

    /// Tier 1 subscriber submits a candidate paragraph. Burns their contribution token.
    pub fn submit_paragraph(
        ctx: Context<SubmitParagraph>,
        content_hash: [u8; 32],
        arweave_uri: String,
    ) -> Result<()> {
        require!(
            arweave_uri.len() <= MAX_ARWEAVE_URI_LEN,
            StoryError::UriTooLong
        );

        let now = Clock::get()?.unix_timestamp;
        let round_key = ctx.accounts.round.key();
        let round_piece = ctx.accounts.round.piece;

        require!(ctx.accounts.round.status == RoundStatus::Submissions, StoryError::WrongRoundState);
        require!(now <= ctx.accounts.round.submission_deadline, StoryError::SubmissionWindowClosed);
        require!(
            ctx.accounts.subscriber_record.tier == SubscriberTier::InnerCircle,
            StoryError::WrongTier
        );
        require!(
            ctx.accounts.subscriber_record.contribution_tokens > 0,
            StoryError::InsufficientTokens
        );
        require!(
            ctx.accounts.round.submission_count < ctx.accounts.round.max_submissions,
            StoryError::SubmissionLimitReached
        );

        // Burn the contribution token
        ctx.accounts.subscriber_record.contribution_tokens -= 1;

        // Record the submission
        let submission = &mut ctx.accounts.submission;
        submission.round = round_key;
        submission.piece = round_piece;
        submission.contributor = ctx.accounts.contributor.key();
        submission.content_hash = content_hash;
        submission.arweave_uri = arweave_uri;
        submission.vote_count = 0;
        submission.submitted_at = now;

        // Increment submission count on the round
        ctx.accounts.round.submission_count += 1;

        emit!(ParagraphSubmitted {
            submission: submission.key(),
            round: round_key,
            contributor: submission.contributor,
            submitted_at: now,
        });

        Ok(())
    }

    /// Advance a round from Submissions to Voting phase.
    /// Can be called by creator once submission_deadline has passed.
    pub fn open_voting(ctx: Context<TransitionRound>) -> Result<()> {
        require!(
            ctx.accounts.piece.creator == ctx.accounts.creator.key(),
            StoryError::Unauthorized
        );

        let now = Clock::get()?.unix_timestamp;
        let round = &mut ctx.accounts.round;

        require!(round.status == RoundStatus::Submissions, StoryError::WrongRoundState);
        require!(now >= round.submission_deadline, StoryError::TooEarly);

        round.status = RoundStatus::Voting;

        emit!(VotingOpened {
            round: round.key(),
            piece: round.piece,
        });

        Ok(())
    }

    /// Tier 1 or Tier 2 subscriber casts a vote. Burns their vote token.
    /// PDA seeded from [round, voter] enforces one vote per wallet per round.
    pub fn cast_vote(ctx: Context<CastVote>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let round_key = ctx.accounts.round.key();

        require!(ctx.accounts.round.status == RoundStatus::Voting, StoryError::WrongRoundState);
        require!(now <= ctx.accounts.round.voting_deadline, StoryError::VotingWindowClosed);
        require!(
            ctx.accounts.submission.round == round_key,
            StoryError::SubmissionNotInRound
        );
        require!(
            ctx.accounts.subscriber_record.tier == SubscriberTier::InnerCircle
                || ctx.accounts.subscriber_record.tier == SubscriberTier::Community,
            StoryError::WrongTier
        );
        require!(
            ctx.accounts.subscriber_record.vote_tokens > 0,
            StoryError::InsufficientTokens
        );

        // Burn the vote token
        ctx.accounts.subscriber_record.vote_tokens -= 1;

        // Record the vote (PDA ensures uniqueness per wallet per round)
        let vote = &mut ctx.accounts.vote;
        vote.round = round_key;
        vote.submission = ctx.accounts.submission.key();
        vote.voter = ctx.accounts.voter.key();
        vote.cast_at = now;

        // Increment counts
        ctx.accounts.submission.vote_count += 1;
        ctx.accounts.round.total_votes += 1;

        emit!(VoteCast {
            round: round_key,
            submission: vote.submission,
            voter: vote.voter,
            new_vote_count: ctx.accounts.submission.vote_count,
        });

        Ok(())
    }

    /// Close a round: determine winning submission, seal the paragraph on-chain.
    /// Can be called by creator after voting_deadline has passed.
    pub fn close_round(
        ctx: Context<CloseRound>,
        winning_submission_key: Pubkey,
        creator_note: String,
    ) -> Result<()> {
        require!(
            ctx.accounts.piece.creator == ctx.accounts.creator.key(),
            StoryError::Unauthorized
        );
        require!(
            creator_note.len() <= MAX_CREATOR_NOTE_LEN,
            StoryError::NoteTooLong
        );

        let now = Clock::get()?.unix_timestamp;
        let round = &mut ctx.accounts.round;

        require!(round.status == RoundStatus::Voting, StoryError::WrongRoundState);
        require!(now >= round.voting_deadline, StoryError::TooEarly);
        require!(
            ctx.accounts.winning_submission.round == round.key(),
            StoryError::SubmissionNotInRound
        );
        require!(
            ctx.accounts.winning_submission.key() == winning_submission_key,
            StoryError::SubmissionMismatch
        );

        // Seal the round
        round.status = RoundStatus::Closed;
        round.winning_submission = Some(winning_submission_key);
        round.creator_note = creator_note;

        // Seal the winning paragraph on-chain
        let sealed = &mut ctx.accounts.sealed_paragraph;
        sealed.piece = round.piece;
        sealed.index = ctx.accounts.piece.paragraph_count;
        sealed.content_hash = ctx.accounts.winning_submission.content_hash;
        sealed.arweave_uri = ctx.accounts.winning_submission.arweave_uri.clone();
        sealed.author = ctx.accounts.winning_submission.contributor;
        sealed.sealed_at = now;
        sealed.vote_count = ctx.accounts.winning_submission.vote_count;
        sealed.is_opening = false;

        // Advance piece paragraph count
        ctx.accounts.piece.paragraph_count += 1;

        emit!(RoundClosed {
            round: round.key(),
            piece: round.piece,
            winning_submission: winning_submission_key,
            author: sealed.author,
            paragraph_index: sealed.index,
            vote_count: sealed.vote_count,
            sealed_at: now,
        });

        Ok(())
    }

    /// Creator marks the piece as complete — no more rounds can be opened.
    pub fn complete_piece(ctx: Context<CompletePiece>) -> Result<()> {
        require!(
            ctx.accounts.piece.creator == ctx.accounts.creator.key(),
            StoryError::Unauthorized
        );
        require!(
            ctx.accounts.piece.status == PieceStatus::Active,
            StoryError::PieceNotActive
        );

        ctx.accounts.piece.status = PieceStatus::Complete;

        emit!(PieceCompleted {
            piece: ctx.accounts.piece.key(),
            creator: ctx.accounts.piece.creator,
            paragraph_count: ctx.accounts.piece.paragraph_count,
        });

        Ok(())
    }
}

// ── Account Structs ───────────────────────────────────────────────────────────

#[account]
#[derive(Default)]
pub struct Piece {
    pub creator: Pubkey,          // 32
    pub title: String,            // 4 + MAX_TITLE_LEN
    pub status: PieceStatus,      // 1
    pub paragraph_count: u32,     // 4
    pub round_count: u32,         // 4
    pub created_at: i64,          // 8
}

impl Piece {
    pub const LEN: usize = 8 + 32 + (4 + MAX_TITLE_LEN) + 1 + 4 + 4 + 8;
}

#[account]
pub struct Round {
    pub piece: Pubkey,                      // 32
    pub round_index: u32,                   // 4
    pub submission_deadline: i64,           // 8
    pub voting_deadline: i64,               // 8
    pub status: RoundStatus,                // 1
    pub winning_submission: Option<Pubkey>, // 1 + 32
    pub total_votes: u32,                   // 4
    pub submission_count: u16,              // 2
    pub max_submissions: u16,               // 2
    pub opened_at: i64,                     // 8
    pub creator_note: String,               // 4 + MAX_CREATOR_NOTE_LEN
}

impl Round {
    pub const LEN: usize = 8 + 32 + 4 + 8 + 8 + 1 + 33 + 4 + 2 + 2 + 8
        + (4 + MAX_CREATOR_NOTE_LEN);
}

#[account]
pub struct Submission {
    pub round: Pubkey,           // 32
    pub piece: Pubkey,           // 32
    pub contributor: Pubkey,     // 32
    pub content_hash: [u8; 32],  // 32
    pub arweave_uri: String,     // 4 + MAX_ARWEAVE_URI_LEN
    pub vote_count: u32,         // 4
    pub submitted_at: i64,       // 8
}

impl Submission {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + (4 + MAX_ARWEAVE_URI_LEN) + 4 + 8;
}

#[account]
pub struct Vote {
    pub round: Pubkey,       // 32
    pub submission: Pubkey,  // 32
    pub voter: Pubkey,       // 32
    pub cast_at: i64,        // 8
}

impl Vote {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8;
}

/// On-chain record of a sealed (winning) paragraph.
#[account]
pub struct SealedParagraph {
    pub piece: Pubkey,           // 32
    pub index: u32,              // 4
    pub content_hash: [u8; 32],  // 32
    pub arweave_uri: String,     // 4 + MAX_ARWEAVE_URI_LEN
    pub author: Pubkey,          // 32
    pub sealed_at: i64,          // 8
    pub vote_count: u32,         // 4
    pub is_opening: bool,        // 1
}

impl SealedParagraph {
    pub const LEN: usize = 8 + 32 + 4 + 32 + (4 + MAX_ARWEAVE_URI_LEN) + 32 + 8 + 4 + 1;
}

#[account]
pub struct SubscriberRecord {
    pub creator: Pubkey,          // 32
    pub piece: Pubkey,            // 32
    pub subscriber: Pubkey,       // 32
    pub tier: SubscriberTier,     // 1
    pub contribution_tokens: u8,  // 1
    pub vote_tokens: u8,          // 1
    pub added_at: i64,            // 8
}

impl SubscriberRecord {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 1 + 1 + 1 + 8;
}

// ── Enums ─────────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Default)]
pub enum PieceStatus {
    #[default]
    Active,
    Complete,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Default)]
pub enum RoundStatus {
    #[default]
    Submissions,
    Voting,
    Closed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy)]
pub enum SubscriberTier {
    InnerCircle, // Can submit + vote
    Community,   // Can vote only
    Reader,      // Read only
}

// ── Instruction Accounts ──────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(title: String, opening_hash: [u8; 32], opening_arweave_uri: String)]
pub struct CreatePiece<'info> {
    #[account(
        init,
        payer = creator,
        space = Piece::LEN,
        seeds = [b"piece", creator.key().as_ref(), title.as_bytes()],
        bump
    )]
    pub piece: Account<'info, Piece>,

    #[account(
        init,
        payer = creator,
        space = SealedParagraph::LEN,
        seeds = [b"paragraph", piece.key().as_ref(), &0u32.to_le_bytes()],
        bump
    )]
    pub opening_paragraph: Account<'info, SealedParagraph>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct OpenRound<'info> {
    #[account(
        init,
        payer = creator,
        space = Round::LEN,
        seeds = [b"round", piece.key().as_ref(), &piece.round_count.to_le_bytes()],
        bump
    )]
    pub round: Account<'info, Round>,

    #[account(
        mut,
        seeds = [b"piece", creator.key().as_ref(), piece.title.as_bytes()],
        bump,
        has_one = creator @ StoryError::Unauthorized
    )]
    pub piece: Account<'info, Piece>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddSubscriber<'info> {
    #[account(
        init_if_needed,
        payer = creator,
        space = SubscriberRecord::LEN,
        seeds = [b"subscriber", piece.key().as_ref(), subscriber.key().as_ref()],
        bump
    )]
    pub subscriber_record: Account<'info, SubscriberRecord>,

    #[account(
        seeds = [b"piece", creator.key().as_ref(), piece.title.as_bytes()],
        bump,
        has_one = creator @ StoryError::Unauthorized
    )]
    pub piece: Account<'info, Piece>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: subscriber wallet address, just stored
    pub subscriber: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveSubscriber<'info> {
    #[account(
        mut,
        close = creator,
        seeds = [b"subscriber", piece.key().as_ref(), subscriber.key().as_ref()],
        bump
    )]
    pub subscriber_record: Account<'info, SubscriberRecord>,

    #[account(
        seeds = [b"piece", creator.key().as_ref(), piece.title.as_bytes()],
        bump,
        has_one = creator @ StoryError::Unauthorized
    )]
    pub piece: Account<'info, Piece>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: subscriber wallet address
    pub subscriber: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct IssueToken<'info> {
    #[account(
        mut,
        seeds = [b"subscriber", piece.key().as_ref(), subscriber_record.subscriber.as_ref()],
        bump
    )]
    pub subscriber_record: Account<'info, SubscriberRecord>,

    #[account(
        seeds = [b"round", piece.key().as_ref(), &(piece.round_count - 1).to_le_bytes()],
        bump
    )]
    pub round: Account<'info, Round>,

    #[account(
        seeds = [b"piece", creator.key().as_ref(), piece.title.as_bytes()],
        bump,
        has_one = creator @ StoryError::Unauthorized
    )]
    pub piece: Account<'info, Piece>,

    #[account(mut)]
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct SubmitParagraph<'info> {
    #[account(
        init,
        payer = contributor,
        space = Submission::LEN,
        seeds = [b"submission", round.key().as_ref(), contributor.key().as_ref()],
        bump
    )]
    pub submission: Account<'info, Submission>,

    #[account(
        mut,
        seeds = [b"round", piece.key().as_ref(), &round.round_index.to_le_bytes()],
        bump
    )]
    pub round: Account<'info, Round>,

    #[account(
        mut,
        seeds = [b"subscriber", piece.key().as_ref(), contributor.key().as_ref()],
        bump,
        constraint = subscriber_record.subscriber == contributor.key() @ StoryError::Unauthorized
    )]
    pub subscriber_record: Account<'info, SubscriberRecord>,

    pub piece: Account<'info, Piece>,

    #[account(mut)]
    pub contributor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransitionRound<'info> {
    #[account(
        mut,
        seeds = [b"round", piece.key().as_ref(), &round.round_index.to_le_bytes()],
        bump
    )]
    pub round: Account<'info, Round>,

    #[account(
        seeds = [b"piece", creator.key().as_ref(), piece.title.as_bytes()],
        bump,
        has_one = creator @ StoryError::Unauthorized
    )]
    pub piece: Account<'info, Piece>,

    #[account(mut)]
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(
        init,
        payer = voter,
        space = Vote::LEN,
        // PDA seeded from [round, voter] — enforces one vote per wallet per round at protocol level
        seeds = [b"vote", round.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,

    #[account(
        mut,
        seeds = [b"round", piece.key().as_ref(), &round.round_index.to_le_bytes()],
        bump
    )]
    pub round: Account<'info, Round>,

    #[account(mut)]
    pub submission: Account<'info, Submission>,

    #[account(
        mut,
        seeds = [b"subscriber", piece.key().as_ref(), voter.key().as_ref()],
        bump,
        constraint = subscriber_record.subscriber == voter.key() @ StoryError::Unauthorized
    )]
    pub subscriber_record: Account<'info, SubscriberRecord>,

    pub piece: Account<'info, Piece>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseRound<'info> {
    #[account(
        init,
        payer = creator,
        space = SealedParagraph::LEN,
        seeds = [b"paragraph", piece.key().as_ref(), &piece.paragraph_count.to_le_bytes()],
        bump
    )]
    pub sealed_paragraph: Account<'info, SealedParagraph>,

    #[account(
        mut,
        seeds = [b"round", piece.key().as_ref(), &round.round_index.to_le_bytes()],
        bump
    )]
    pub round: Account<'info, Round>,

    #[account(mut)]
    pub winning_submission: Account<'info, Submission>,

    #[account(
        mut,
        seeds = [b"piece", creator.key().as_ref(), piece.title.as_bytes()],
        bump,
        has_one = creator @ StoryError::Unauthorized
    )]
    pub piece: Account<'info, Piece>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompletePiece<'info> {
    #[account(
        mut,
        seeds = [b"piece", creator.key().as_ref(), piece.title.as_bytes()],
        bump,
        has_one = creator @ StoryError::Unauthorized
    )]
    pub piece: Account<'info, Piece>,

    #[account(mut)]
    pub creator: Signer<'info>,
}

// ── Events ────────────────────────────────────────────────────────────────────

#[event]
pub struct PieceCreated {
    pub piece: Pubkey,
    pub creator: Pubkey,
    pub title: String,
    pub created_at: i64,
}

#[event]
pub struct RoundOpened {
    pub round: Pubkey,
    pub piece: Pubkey,
    pub round_index: u32,
    pub submission_deadline: i64,
    pub voting_deadline: i64,
}

#[event]
pub struct VotingOpened {
    pub round: Pubkey,
    pub piece: Pubkey,
}

#[event]
pub struct SubscriberAdded {
    pub piece: Pubkey,
    pub subscriber: Pubkey,
    pub tier: SubscriberTier,
}

#[event]
pub struct ParagraphSubmitted {
    pub submission: Pubkey,
    pub round: Pubkey,
    pub contributor: Pubkey,
    pub submitted_at: i64,
}

#[event]
pub struct VoteCast {
    pub round: Pubkey,
    pub submission: Pubkey,
    pub voter: Pubkey,
    pub new_vote_count: u32,
}

#[event]
pub struct RoundClosed {
    pub round: Pubkey,
    pub piece: Pubkey,
    pub winning_submission: Pubkey,
    pub author: Pubkey,
    pub paragraph_index: u32,
    pub vote_count: u32,
    pub sealed_at: i64,
}

#[event]
pub struct PieceCompleted {
    pub piece: Pubkey,
    pub creator: Pubkey,
    pub paragraph_count: u32,
}

// ── Errors ────────────────────────────────────────────────────────────────────

#[error_code]
pub enum StoryError {
    #[msg("Only the piece creator can perform this action")]
    Unauthorized,
    #[msg("Piece is not active")]
    PieceNotActive,
    #[msg("Title exceeds maximum length")]
    TitleTooLong,
    #[msg("Arweave URI exceeds maximum length")]
    UriTooLong,
    #[msg("Creator note exceeds maximum length")]
    NoteTooLong,
    #[msg("Invalid duration — must be greater than zero")]
    InvalidDuration,
    #[msg("Round is not in the expected state")]
    WrongRoundState,
    #[msg("Subscriber tier does not permit this action")]
    WrongTier,
    #[msg("Subscriber has no tokens remaining for this action")]
    InsufficientTokens,
    #[msg("Submission window has closed")]
    SubmissionWindowClosed,
    #[msg("Voting window has closed")]
    VotingWindowClosed,
    #[msg("Maximum submission limit reached for this round")]
    SubmissionLimitReached,
    #[msg("Submission does not belong to this round")]
    SubmissionNotInRound,
    #[msg("Submission key does not match provided key")]
    SubmissionMismatch,
    #[msg("Action is too early — deadline has not yet passed")]
    TooEarly,
}

// Alias for SubmitParagraph subscriber_record has_one constraint
// In Anchor, the has_one field name must match the account field.
// Here subscriber_record.subscriber must match contributor signer.
// We rely on the seeds check + manual require! in the instruction body.
