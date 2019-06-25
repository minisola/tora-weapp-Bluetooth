import Taro, { Component, clearStorage } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { AtButton, AtNoticebar, AtForm, AtSwitch, AtToast, AtList, AtListItem } from 'taro-ui'
import './index.less'
import { convertPatternGroupToTask } from 'fast-glob/out/managers/tasks';

export default class Index extends Component {
  constructor() {
    this.state = {
      waybillCode: '',
      printBtnShow: false,
      linkStart: false,
      errText: '',
      toastShow: false,
      toastIcon: '',
      devices: []
    }
  }
  config = {
    navigationBarTitleText: '智联云蓝牙打印'
  }

  componentWillMount() {
    //如果有运单协议号
    if (this.$router.params && this.$router.params.id) {
      this.setState({
        waybillCode: this.$router.params.id
      })
    }
  }
  componentDidMount() { }

  componentWillUnmount() { }

  componentDidShow() { }

  componentDidHide() { }


  //提示信息
  showToast(success, msg) {
    const { toastShow, errText } = this.state
    this.setState({
      toastShow: true,
      errText: msg,
      toastIcon: success ? 'check-circle' : 'close-circle'
    })
  }

  //开始搜索打印机
  async handleLinkStart() {
    const { linkStart } = this.state
    this.setState({
      linkStart: !linkStart
    })

    if (!linkStart) {
      const res = await Taro.openBluetoothAdapter().catch(res => {
        this.setState({
          linkStart: false
        })
        switch (res.errCode) {
          case 10001:
            this.showToast(0, '请开启设备蓝牙')
            break;
          default:
            this.showToast(0, res.errMsg)
            break;
        }
      })
      if (!res) return
      console.log(`初始化成功:${res.errMsg}`)
      console.log(`开始搜索设备...`)
      this.searchDevices()
    } else {
      await Taro.closeBluetoothAdapter()
      this.setState({
        devices:[]
      })
    }
}

//开始搜索设备
async searchDevices() {
  //开启搜索
  const search = await Taro.startBluetoothDevicesDiscovery().catch(res => {
    this.showToast(0, res.errMsg)
  })
  //监听寻找到新设备的事件
  Taro.onBluetoothDeviceFound(res => {
    console.log(`搜索到设备:` + JSON.stringify(res.devices));
    this.setState({
      devices: [...res.devices,...this.state.devices]
    })
  })

}


render() {
  return (
    <View className='index'>
      <AtNoticebar>
        当前运单协议单号: {this.state.waybillCode}
      </AtNoticebar>
      <View className={`print-head`}>
        <View className="icon-wrap">
          <View className="zan-icon zan-icon-qr"></View>
        </View>
        <Text className="print-title">智联云蓝牙打印</Text>
        <Text className="zan-font-12 zan-c-gray-dark">仅支持XT423机型</Text>
      </View>
      <AtForm>
        <AtSwitch title='开始搜索打印机' checked={this.state.linkStart} onChange={this.handleLinkStart.bind(this)} />
      </AtForm>
      <AtList>
        {this.state.devices.map((el) =>{
          return <AtListItem title={el.name} key={el.deviceId} arrow='right' />
        }
        )}
      </AtList>
      <AtButton disabled>请先连接打印机</AtButton>
      {/* 状态提示 */}
      <AtToast isOpened={this.state.toastShow} text={this.state.errText} hasMask={true} icon={this.state.toastIcon}></AtToast>
    </View>
  )
}
}
