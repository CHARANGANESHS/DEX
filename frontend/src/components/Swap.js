import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import { ArrowDownOutlined, DownOutlined, SettingOutlined } from "@ant-design/icons";
import tokenList from "../tokenList.json";
import axios from "axios";
import { useSendTransaction, useWaitForTransaction } from "wagmi";

function Swap(props) {
  const { address, isConnected } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [slippage, setSlippage] = useState(2.5);
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [prices, setPrices] = useState(null);
  const [txDetails, setTxDetails] = useState({
    to: null,
    data: null,
    value: null,
  });

  const { data, sendTransaction } = useSendTransaction({
    request: {
      from: address,
      to: String(txDetails.to),
      data: String(txDetails.data),
      value: String(txDetails.value),
    },
  });

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const handleSlippageChange = (e) => setSlippage(e.target.value);

  const changeAmount = (e) => {
    setTokenOneAmount(e.target.value);
    if (e.target.value && prices) {
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(2));
    } else {
      setTokenTwoAmount(null);
    }
  };

  const switchTokens = () => {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    const one = tokenOne;
    const two = tokenTwo;
    setTokenOne(two);
    setTokenTwo(one);
    fetchPrices(two.address, one.address);
  };

  const openModal = (token) => {
    setChangeToken(token);
    setIsOpen(true);
  };

  const modifyToken = (index) => {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    if (changeToken === 1) {
      setTokenOne(tokenList[index]);
      fetchPrices(tokenList[index].address, tokenTwo.address);
    } else {
      setTokenTwo(tokenList[index]);
      fetchPrices(tokenOne.address, tokenList[index].address);
    }
    setIsOpen(false);
  };

  const fetchPrices = async (one, two) => {
    try {
      const response = await axios.get(`http://localhost:3001/tokenPrice`, {
        params: { addressOne: one, addressTwo: two },
      });
      console.log(response.data);
      setPrices(response.data);
    } catch (error) {
      console.error("Error fetching token prices:", error.message);
      messageApi.open({
        type: "error",
        content: "Failed to fetch token prices. Please try again.",
      });
    }
  };

  const fetchDexSwap = async () => {
    try {
      const allowance = await axios.get(`/proxy/1inch/v6.0/1/approve/allowance`, {
        params: {
          tokenAddress: tokenOne.address,
          walletAddress: address,
        },
      });

      if (Number(allowance.data.allowance) <= 0) {
        const approve = await axios.get(`/proxy/1inch/v6.0/1/approve/transaction`, {
          params: { tokenAddress: tokenOne.address },
        });

        setTxDetails(approve.data);
        console.log("Not Approved");
        return;
      }

      const amountInWei = tokenOneAmount.padEnd(
        tokenOne.decimals + String(tokenOneAmount).length,
        "0"
      );

      const tx = await axios.get(`/proxy/1inch/v6.0/1/swap`, {
        params: {
          fromTokenAddress: tokenOne.address,
          toTokenAddress: tokenTwo.address,
          amount: amountInWei,
          fromAddress: address,
          slippage,
        },
      });

      const decimals = Number(`1E${tokenTwo.decimals}`);
      setTokenTwoAmount((Number(tx.data.toTokenAmount) / decimals).toFixed(2));
      setTxDetails(tx.data.tx);
    } catch (error) {
      console.error("Error during fetchDexSwap:", error.message);
      messageApi.open({
        type: "error",
        content: "Swap failed. Please try again.",
      });
    }
  };

  useEffect(() => {
    fetchPrices(tokenList[0].address, tokenList[1].address);
  }, []);

  useEffect(() => {
    if (txDetails.to && isConnected) {
      sendTransaction();
    }
  }, [txDetails]);

  useEffect(() => {
    messageApi.destroy();
    if (isLoading) {
      messageApi.open({
        type: "loading",
        content: "Transaction is Pending...",
        duration: 0,
      });
    }
  }, [isLoading]);

  useEffect(() => {
    messageApi.destroy();
    if (isSuccess) {
      messageApi.open({
        type: "success",
        content: "Transaction Successful!",
        duration: 1.5,
      });
    } else if (txDetails.to) {
      messageApi.open({
        type: "error",
        content: "Transaction Failed!",
        duration: 1.5,
      });
    }
  }, [isSuccess]);

  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  );

  return (
    <>
      {contextHolder}
      <Modal open={isOpen} footer={null} onCancel={() => setIsOpen(false)} title="Select a token">
        <div className="modalContent">
          {tokenList?.map((e, i) => (
            <div className="tokenChoice" key={i} onClick={() => modifyToken(i)}>
              <img src={e.img} alt={e.ticker} className="tokenLogo" />
              <div className="tokenChoiceNames">
                <div className="tokenName">{e.name}</div>
                <div className="tokenTicker">{e.ticker}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <h4>Swap</h4>
          <Popover title="Settings" trigger="click" placement="bottomRight" content={settings}>
            <SettingOutlined className="cog" />
          </Popover>
        </div>
        <div className="inputs">
          <Input placeholder="0" value={tokenOneAmount} onChange={changeAmount} disabled={!prices} />
          <Input placeholder="0" value={tokenTwoAmount} disabled={true} />
          <div className="switchButton" onClick={switchTokens}>
            <ArrowDownOutlined className="switchArrow" />
          </div>
          <div className="assetOne" onClick={() => openModal(1)}>
            <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo" />
            {tokenOne.ticker}
            <DownOutlined />
          </div>
          <div className="assetTwo" onClick={() => openModal(2)}>
            <img src={tokenTwo.img} alt="assetTwoLogo" className="assetLogo" />
            {tokenTwo.ticker}
            <DownOutlined />
          </div>
        </div>
        <button
          className="swapButton"
          disabled={!tokenOneAmount || !isConnected}
          onClick={fetchDexSwap}
        >
          Swap
        </button>
      </div>
    </>
  );
}

export default Swap;
