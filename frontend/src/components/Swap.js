import React, { useState, useEffect } from 'react'
import { Input, Popover, Radio, Modal} from 'antd';
import { ArrowDownOutlined, DownOutlined, SettingOutlined, } from '@ant-design/icons';
import tokenList from '../tokenList.json';
import axios from 'axios';

function Swap() {

  const [slippage, setSlippage] = useState(2.5);
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);

  const [prices, setPrices] = useState(null);

  const handleSlippageChange = (e) => {
    setSlippage(e.target.value);
  }

  const changeAmount = (e) => {
    setTokenOneAmount(e.target.value);
    if (e.target.value && prices) {
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(2));
    }
    else {
      setTokenTwoAmount(null);
    }
  }

  const switchTokens = () => {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    const one = tokenOne;
    const two = tokenTwo;
    setTokenOne(two);
    setTokenTwo(one);
    fetchPrices(two.address, one.address);
  }
  function openModal(token) {
    setChangeToken(token);
    setIsOpen(true);
  }

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
  }


  const fetchPrices = async (one, two) => {
    const response = await axios.get(`http://localhost:3001/tokenPrice`, {
      params: { addressOne: one, addressTwo: two }
    }
    );
    console.log(response.data);
    setPrices(response.data);
  }

  useEffect(() => {
    fetchPrices(tokenList[0].address, tokenList[1].address);
  }, [])

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
  )

  return (
    <>
      <Modal open={isOpen} footer={null} onCancel={() => setIsOpen(false)} title="Select a token" >
        <div className='modalContet'>
          {tokenList?.map((e, i) => {
            return (
              <div
                className='tokenChoice'
                key={i}
                onClick={() => { modifyToken(i) }}
              >
                <img src={e.img} alt={e.ticker} className='tokenLogo' />
                <div className='tokenChoiceNames'>
                  <div className='tokenName'>{e.name}</div>
                  <div className='tokenTicker'>{e.ticker}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
      <div className='tradeBox' >
        <div className='tradeBoxHeader'>
          <h4>Swap</h4>
          <Popover title="Settings" trigger="click" placement='bottomRight' content={settings} >
            <SettingOutlined className='cog'></SettingOutlined>
          </Popover>
        </div>
        <div className='inputs'>
          <Input placeholder='0' value={tokenOneAmount} onChange={changeAmount} disabled={!prices}></Input>
          <Input placeholder='0' value={tokenTwoAmount} disabled={true}></Input>
          <div className='switchButton' onClick={switchTokens}>
            <ArrowDownOutlined className='switchArrow'></ArrowDownOutlined>
          </div>
          <div className='assetOne' onClick={() => openModal(1)}>
            <img src={tokenOne.img} alt='assetOneLogo' className='assetLogo' />
            {tokenOne.ticker}
            <DownOutlined></DownOutlined>
          </div>

          <div className='assetTwo' onClick={() => openModal(2)}>
            <img src={tokenTwo.img} alt='assetTwoLogo' className='assetLogo' />
            {tokenTwo.ticker}
            <DownOutlined></DownOutlined>
          </div>
        </div>
        <div className='swapButton' disabled={!tokenOneAmount}>Swap</div>
      </div>
    </>

  )
}

export default Swap