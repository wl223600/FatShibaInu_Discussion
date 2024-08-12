---
title: Ubuntu设置自动更新
description: 已经愈发觉得没空折腾VPS，何况是养着两台，安全更新又不能不装，所以打算设置自动更新。
tags: []
id: '53'
categories:
  - - 折腾笔记
date: 2019-02-02 22:54:00
---

大三医学狗已经愈发觉得没空折腾VPS，何况是养着两台，安全更新又不能不装，所以打算设置自动更新。

（如果没有安装过这个包的话）首先，安装unattendeed-upgrades。
``````shell
sudo apt install unattended-upgrades
``````
要配置_unattended-upgrades_, 编辑 /etc/apt/apt.conf.d/50unattended-upgrades 并且编辑下面的内容以满足您的需求:
``````conf
Unattended-Upgrade::Allowed-Origins {
        "${distro\_id}:${distro\_codename}";
        "${distro\_id}:${distro\_codename}-security";
//      "${distro\_id}:${distro\_codename}-updates";
//      "${distro\_id}:${distro\_codename}-proposed";
//      "${distro\_id}:${distro\_codename}-backports";
};
``````
您可以把您不想更新的内容列入黑名单（_blacklisted_） 于是它们将不再被自动更新。
``````conf
Unattended-Upgrade::Package-Blacklist {
//      "vim";
//      "libc6";
//      "libc6-dev";
//      "libc6-i686";
};
``````
要启用unattended-upgrade, 编辑 /etc/apt/apt.conf.d/20auto-upgrades 并且设置恰当的 _apt_ 配置选项:
``````conf
//下列双引号内的数字表示每隔\*天执行一次。
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
``````
以上配置每天更新包列表，下载并安装可用的升级。 每周清理本地下载档案。 在升级到较新版本的Ubuntu的服务器上，根据您的响应，上面列出的文件可能不在那里。 在这种情况下，创建此名称的新文件也应该有效。

_unattended-upgrades_ 的运行结果将会被记录到 ```/var/log/unattended-upgrades```.

这个设置好像已经很多年没变过了，8.04年代就出现了这个玩意…此外，官方帮助还有设置更新通知的功能，请参考下面的链接。

参考（英语好的大佬可以直接查看）：[https://help.ubuntu.com/lts/serverguide/automatic-updates.html](https://help.ubuntu.com/lts/serverguide/automatic-updates.html)