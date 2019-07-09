import Taro, { Component, clearStorage } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { AtButton, AtNoticebar, AtForm, AtSwitch, AtList, AtListItem } from 'taro-ui'
import { showToast, getData } from '../../utils/utils'
import './index.less'

export default class Index extends Component {
  constructor() {
    super()
    this.state = {
      waybillCode: '',
      printBtnShow: false,
      linkStart: false,
      errText: '',
      toastShow: false,
      toastIcon: '',
      devices: [],
      currentDevice: {
        id: "",
        serviceId: "",
        characteristicId: ""
      }
    }
  }
  config = {
    navigationBarTitleText: '蓝牙打印'
  }

  componentWillMount() {
    //如果有运单协议号
    if (this.$router.params && this.$router.params.id) {
      this.setState({
        waybillCode: this.$router.params.id
      })
    }
  }
  componentDidMount() {
    getData(1,2)
  }

  componentWillUnmount() { }

  componentDidShow() { }

  componentDidHide() { }




  //开始搜索打印机
  async handleLinkStart() {
    this.setState(prev => ({
      linkStart: !prev.linkStart
    }), async () => {
      const { linkStart } = this.state
      if (linkStart) {
        const res = await Taro.openBluetoothAdapter().catch(res => {
          this.setState({
            linkStart: false
          })
          console.log(res.errCode);
          switch (res.errCode) {
            case 10001:
              showToast('请检查蓝牙是否已打开')
              break;
            default:
              showToast(res.errMsg)
              break;
          }
        })
        if (!res) return
        console.log(`初始化成功:${res.errMsg}`)
        console.log(`开始搜索设备...`)
        this.searchDevices()
      } else {
        this.stopScan()
      }
    })
  }

  //开始搜索设备
  searchDevices() {
    this.setState({
      device: []
    }, async () => {
      //开启搜索
      await Taro.startBluetoothDevicesDiscovery().catch(res => {
        showToast(0, res.errMsg)
      })
      //监听寻找到新设备的事件
      Taro.onBluetoothDeviceFound(res => {
        console.log(`搜索到设备:` + JSON.stringify(res.devices))
        this.setState(state => ({
          devices: [...res.devices, ...state.devices]
        }))
      })
    })
  }

  //停止搜索设备
  stopScan() {
    Taro.stopBluetoothDevicesDiscovery({
      success: () => {
        console.log("停止蓝牙搜索");
      }
    });
  }
  //断开与当前的设备的链接
  closeConnection(deviceId) {
    const res = Taro.closeBLEConnection({
      deviceId: deviceId
    })
  }
  /**
   * 连接设备
   * @param {object} device 设备信息
   */
  async connectDevice(device) {
    const { deviceId } = device
    const currentDevice = {}
    Taro.showLoading({
      title: '连接中...'
    })
    this.stopScan()
    console.log(device);
    const connect = await Taro.createBLEConnection({ deviceId }).catch((res) => {
      showToast(res.errMsg)
    })
    if (!connect) return
    currentDevice['deviceId'] = device.deviceId
    this.setState({
      device: {
        id: device.deviceId
      }
    })
    //获取XT423型号的服务信息
    const service = await Taro.getBLEDeviceServices({ deviceId }).catch(res => {
      showToast(res.errMsg)
    })
    console.log(service);
    if (!service) return
    const services = service.services
    console.log(`获取服务:${services}`);
    services.forEach(el => {
      if (el.uuid.indexOf("49535343-") > -1)
        currentDevice['serviceId'] = el.uuid
    });
    if (!currentDevice['serviceId']) {
      showToast('无法获取打印机服务信息')
      this.closeConnection(deviceId)
    }
    //获取XT423型号的特征值信息
    const characteristic = await Taro.getBLEDeviceCharacteristics({
      deviceId,
      serviceId: currentDevice.serviceId
    }).catch(res => {
      showToast(res.errMsg)
    })
    if (!characteristic) return
    const characteristics = characteristic.characteristics
    console.log(`获取characteristics:${characteristics}`);
    characteristics.forEach(el => {
      if (
        el.uuid.indexOf("49535343-") > -1 &&
        el.properties.write == true
      ) {
        currentDevice['characteristicId'] = el.uuid
      }
    });
    if (!currentDevice['characteristicId']) {
      showToast('无法获取打印机特征值信息')
      this.closeConnection(deviceId)
    }
    this.setState({
      currentDevice
    })
    Taro.hideLoading()
    showToast('连接成功', 'success')
  }

/**
 * 开始打印
 * @param {int} flag 1:托运方 0:承运方
 */
  async print(flag){

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
          <Text className="print-title">蓝牙打印</Text>
          {/* <Text className="zan-font-12 zan-c-gray-dark">仅支持XT423机型</Text> */}
        </View>
        <AtForm>
          <AtSwitch title='开始搜索打印机' checked={this.state.linkStart} onChange={this.handleLinkStart.bind(this)} />
        </AtForm>
        <AtList>
          {this.state.devices.map(el => {
            return <AtListItem title={el.name || el.deviceId} key={el.deviceId} arrow='right' onClick={this.connectDevice.bind(this, el)} />
          }
          )}
        </AtList>
        {
          this.state.currentDevice.deviceId&&(
          <view>
            <AtButton onClick={this.print.bind(this,'1')}>打印托运方联</AtButton>
            <AtButton onClick={this.print.bind(this,'0')}>打印承运方联</AtButton>
          </view>)
        }
        {!this.state.currentDevice.deviceId&&<AtButton disabled>请先连接打印机</AtButton>}
      </View>
    )
  }
} { }
