import { Buffer } from 'buffer'
if (typeof window !== 'undefined' && !window.Buffer) {
  // @ts-ignore
  window.Buffer = Buffer
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { clusterApiUrl } from '@solana/web3.js'

import App from './App'
import './index.css'
import '@solana/wallet-adapter-react-ui/styles.css'

const network = (import.meta.env.VITE_SOLANA_NETWORK as string) || 'localnet'
const endpoint =
  import.meta.env.VITE_RPC_ENDPOINT ||
  (network === 'localnet' ? 'http://127.0.0.1:8899' : clusterApiUrl('devnet'))

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()]

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>
)
