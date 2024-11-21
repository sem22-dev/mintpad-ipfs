"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractAbi from "./contractAbi.json"; // Ensure this is your actual ABI file

const UpdateIpfsToContract = ({
  ipfsLink: initialIpfsLink,
  fileSize: initialFileSize,
  collectionSize,
}) => {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [contractAddress, setContractAddress] = useState("");
  const [ipfsLink, setIpfsLink] = useState(initialIpfsLink || "");
  const [amount, setAmount] = useState(collectionSize);
  const [data, setData] = useState("0x");

  useEffect(() => {
    if (initialIpfsLink) {
      setIpfsLink(initialIpfsLink);
    }
  }, [initialIpfsLink]);

  const updateContract = async () => {
    if (!ipfsLink || !amount || !contractAddress || !data) {
      setStatus("IPFS link, amount, contract address, or data is missing.");
      return;
    }

    setLoading(true);
    try {
      const baseURIForTokens = String(ipfsLink);
      const dataBytes = ethers.utils.arrayify(data);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractAbi, signer);

      const tx = await contract.lazyMint(amount, baseURIForTokens, dataBytes);
      await tx.wait();

      setStatus("Contract updated successfully.");
    } catch (error) {
      setStatus(`Contract update error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "30px", textAlign: "center" }}>
      <h2 style={{ marginBottom: "20px" }}>Update Contract with IPFS Data</h2>
      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="Enter Contract Address"
          style={inputStyles}
        />
      </div>
      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          value={ipfsLink}
          onChange={(e) => setIpfsLink(e.target.value)}
          placeholder="Enter IPFS Link"
          style={inputStyles}
        />
      </div>
      <div style={{ marginBottom: "15px" }}>
  <input
    type="text"
    value={amount}
    onChange={(e) => {
      // Only update if the input is a valid number
      const newValue = e.target.value;
      if (/^\d*$/.test(newValue)) {
        setAmount(newValue ? parseInt(newValue, 10) : "");
      }
    }}
    placeholder="Enter Amount"
    style={inputStyles}
  />
</div>

      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          value={data}
          onChange={(e) => setData(e.target.value)}
          placeholder="Enter Data (0x...)"
          style={inputStyles}
        />
      </div>

      <button
        onClick={updateContract}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          fontWeight: "600",
          color: "white",
          background: loading
            ? "#8c8c8c"
            : "linear-gradient(135deg, #4e74e6, #1d56f1)",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.3s ease-in-out",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        }}
        disabled={loading}
      >
        {loading ? "Updating..." : "Update Contract"}
      </button>

      {status && (
        <p
          style={{
            marginTop: "20px",
            fontSize: "16px",
            color: status.includes("error") ? "#ff4d4d" : "#4caf50",
          }}
        >
          {status}
        </p>
      )}
    </div>
  );
};

// Enhanced styles for input fields
const inputStyles = {
  width: "80%",
  padding: "12px",
  margin: "0 auto",
  fontSize: "14px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  transition: "border-color 0.2s",
  outline: "none",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  backgroundColor: "black",
};

inputStyles[':focus'] = {
  borderColor: "#4e74e6",
};

export default UpdateIpfsToContract;
