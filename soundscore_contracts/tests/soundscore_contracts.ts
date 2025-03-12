import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SoundscoreContracts } from "../target/types/soundscore_contracts";

describe("soundscore_contracts", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SoundscoreContracts as Program<SoundscoreContracts>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
