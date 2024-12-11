"use client";
import { Button } from "@/components/ui/button";
import React, { useCallback, useEffect } from "react";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import axios from "axios";
import { BACKEND_URL } from "@/Utils/Utils";

const Appbar = () => {
  const { publicKey, signMessage } = useWallet();

  const signAndSend = useCallback(async () => {
    if (!publicKey || !signMessage) {
      console.error("Wallet not connected");
      return;
    }

    try {
      const message = new TextEncoder().encode("Sign into nirvana");
      const signature = await signMessage(message);
      console.log(signature);
      const response = await axios.post(`${BACKEND_URL}/v1/user/signin`, {
        signature,
        publicKey:publicKey?.toString(),
      });
      localStorage.setItem("token", response.data.token);
    } catch (error) {
      console.error("Failed to sign message:", error);
    }
  }, [publicKey, signMessage]);

  useEffect(() => {
    if (publicKey) {
      signAndSend();
    }
  }, [publicKey, signAndSend]);

  return (
    <div className="w-full h-full border border-black   ">
      <div className="navbar bg-black text-white">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
              <li>
                <a>Item 1</a>
              </li>
              <li>
                <a>Your Tasks</a>
                <ul className="p-2">
                  <li>
                    <a>Submenu 1</a>
                  </li>
                  <li>
                    <a>Submenu 2</a>
                  </li>
                </ul>
              </li>
              <li>
                <a>Item 3</a>
              </li>
            </ul>
          </div>
          <a className="btn btn-ghost text-4xl">SoundScore</a>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu text-xl menu-horizontal px-1">
            <li>
              {/* <a>Item 1</a> */}
            </li>
            <li>
              <details>
                <summary>Your Tasks</summary>
                <ul className="p-2">
                  <li>
                    <a>Submenu 1</a>
                  </li>
                  <li>
                    <a>Submenu 2</a>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              {/* <a>Item 3</a> */}
            </li>
          </ul>
        </div>
        <div className="navbar-end">
          {/* <a className="btn btn-secondary text-xl">Connect</a> */}
          {/* {publickey ? <WalletMultiButton/> : <WalletDisconnectButton/>} */}
          <WalletMultiButton />
        </div>
      </div>
    </div>
  );
};

export default Appbar;
