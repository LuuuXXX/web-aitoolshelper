import 'server-only'

export function isSmsConfigured(): boolean {
  return !!(
    process.env.ALIYUN_SMS_ACCESS_KEY_ID &&
    process.env.ALIYUN_SMS_ACCESS_KEY_SECRET &&
    process.env.ALIYUN_SMS_SIGN_NAME &&
    process.env.ALIYUN_SMS_TEMPLATE_CODE
  )
}

export async function sendSms(phone: string, code: string): Promise<boolean> {
  if (!isSmsConfigured()) {
    console.warn('SMS not configured, skipping send to:', phone)
    return false
  }

  // 阿里云短信发送需要安装 @alicloud/dysmsapi20170525
  // 配置完成后取消下方注释并安装依赖：
  // npm install @alicloud/dysmsapi20170525 @alicloud/openapi-client
  //
  // import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
  // import * as $OpenApi from '@alicloud/openapi-client';
  //
  // const config = new $OpenApi.Config({
  //   accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID,
  //   accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET,
  // });
  // config.endpoint = 'dysmsapi.aliyuncs.com';
  // const client = new Dysmsapi20170525.default(config);
  // const req = new $Dysmsapi20170525.SendSmsRequest({
  //   phoneNumbers: phone,
  //   signName: process.env.ALIYUN_SMS_SIGN_NAME,
  //   templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE,
  //   templateParam: JSON.stringify({ code }),
  // });
  // await client.sendSms(req);

  console.warn('SMS not configured, skipping send to:', phone)
  return false
}
