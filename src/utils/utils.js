import Taro from '@tarojs/taro'

//生成buffer
export const createBuffer = hex => {
  var typedArray = new Uint8Array(
    hex.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16);
    })
  );
  return typedArray.buffer;
}

//提示信息
export const showToast = (msg, successIcon) => {
  Taro.showToast({
    title: msg,
    mask: true,
    icon: !successIcon ? 'none' : successIcon
  })
}

//从服务器获取打印信息
export const getData = async (flag, id) => {
  const res = await Taro
    .request({
      url: "https://wx.56zly.com/weixinPrint/getPrintData?flag=" +
        flag +
        "&waybillId=" +
        (id || '1530870384627')
    }).catch(() => {
      showToast("服务器请求出错")
    })
  if (!res) return false
  const waybillData = JSON.parse(res.data).result;
  if (JSON.parse(res.data).status == 0) {
    showToast("没有获取到相关的运单信息")
    return false
  }
  return waybillData
  //   let dataLength = this.createBuffer(this.waybillData).byteLength;
  //   setTimeout(() => {
  //     this.hideLoading();
  //     this.$invoke("zanPopup", "togglePopup");
  //     that.chunk = (dataLength / that.sliceLength).toFixed(0);
  //     console.log(that.chunk);
  //     that.percentChunk = 100 / that.chunk;
  //     that.NowPercent = 0;
  //     console.log(that.percentChunk);
  //     that.$apply()
  //     that.sendData(
  //       that,
  //       that.createBuffer(that.waybillData),
  //       that.connectedDevice.id,
  //       that.connectedDevice.serviceId,
  //       that.connectedDevice.characteristicId
  //     );
  //   }, 1000);
}
