# 千秋 WIFI

许昌校区校园网自动认证工具

## 功能

- 🎯 一键自动登录
- 🔄 自动测速与异常重连
- 👥 账号池管理
- 🌙 深色/浅色主题
- 🖼️ 自定义背景图片

## 技术栈

- React Native + Expo
- TypeScript

## 开发

```bash
cd mobile
npm install
npx expo start
```

## 构建 iOS

使用 GitHub Actions 自动构建：

1. 在仓库设置中添加 Secrets：
   - `CERT_DIR`: 证书目录名称，填写仓库根目录下的目录名即可（如 `证书_00008120-000908503A31A01E`）

2. 证书目录需包含：
   - `.p12` 证书文件
   - `.mobileprovision` 描述文件
   - `密码.txt` 证书密码文件

如果未配置 `CERT_DIR`，工作流会自动在仓库中查找唯一一个同时包含上述 3 个文件的目录。

3. 在 Actions 页面点击 "Build iOS IPA" 工作流运行构建

## 关于

本程序是为了解决许昌校区校园网链接繁琐、容易掉线的问题。

项目由老学长开发，希望同学们砥砺前行。
