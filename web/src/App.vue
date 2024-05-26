<script setup>
import { defineComponent, reactive, ref } from 'vue'
import {
  NConfigProvider,
  NInput,
  NButton,
  NSpace,
  NAlert,
  NText,
  NH2
} from 'naive-ui'
import { darkTheme } from 'naive-ui'
import axios from "axios"

const loading = ref(false)
const address = ref('')
const result = ref({
  status: "",
  message: "",
  data: null
})


async function getTAO() {

  if (!address.value) {
    result.value = {
      status: "fail",
      message: "请输入地址"
    }
    return
  }
  result.value = {
    status: "",
    message: "",
    data: null
  }


  loading.value = true
  const res = await axios.post("https://tea-transfer-server-dkvcaktgb-chenlikes-projects.vercel.app/api/sendTAO", {
    address: address.value
  })
  result.value = res.data

  setTimeout(() => {
    loading.value = false
  }, 1000)

}

function openExplorer() {
  let url = `https://sepolia.basescan.org/tx/${result.value.data.tx}`
  window.open(url)
}



</script>

<template>
  <n-config-provider :theme="darkTheme" :locale="zhCN" :date-locale="dateZhCN">
    <div class="container">
      <n-space vertical>
        <n-h2 type="primary">
          TAO Transfer (Testnet)
        </n-h2>
        <n-input v-model:value="address" placeholder="TEA address  eg:0x289463B7130Bca4c56BfE25D6dd8f392f2305829" />
        <n-alert title="提示" type="default">
          输入你的TEA地址(不是用户名) 获取10个TAO <span style="color:red">仅限没有TAO的地址</span> <br />
          样例:0x289463B7130Bca4c56BfE25D6dd8f392f2305829 <br/>
          代码开源: https://github.com/chenlike/tea-transfer

        </n-alert>
        <n-button @click="getTAO" :loading="loading" type="primary">GET TAO!</n-button>

        <n-alert v-if="result.status == 'success'" title="成功" type="success">
          TAO已发送成功 <br />
          TX: <n-button text @click="openExplorer" target="_blank" type="primary">
            {{ result.data.tx }}
          </n-button>
        </n-alert>

        <n-alert v-else-if="result.status == 'fail'" title="失败" type="error">
          {{ result.message }}
        </n-alert>


      </n-space>
    </div>

  </n-config-provider>
</template>

<style>
body {
  background: black;
  text-align: center;
}

.container {
  text-align: center;
  width: 800px;
  margin: 0 auto;
  margin-top: 40px;
}
</style>