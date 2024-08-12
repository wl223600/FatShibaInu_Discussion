---
title: Ubuntu的nghttp2安装
description: 想不起来当时为啥要装nghttp2了（悲
tags:
  - Linux
id: '31'
categories:
  - - 折腾笔记
date: 2019-02-02 22:22:00
---

nghttp2官方网站：  
[https://nghttp2.org/](https://nghttp2.org/)

可直接在[此处](https://github.com/nghttp2/nghttp2/releases)下载Releases，本文以到发表日为止的最新版本1.29.0示例。

``````shell
# 下载nghttp2(tar.bz2)
wget https://github.com/nghttp2/nghttp2/releases/download/v1.29.0/nghttp2-1.29.0.tar.bz2
# 解压
tar -jxvf nghttp2-1.29.0.tar.bz2
``````
安装nghttp2之前，需要检查一下依赖包，并且补充没有安装的包。

提示：Ubuntu上检索包可以使用：
``````shell
apt-cache search <PackageName> # <PackageName>是你要搜索的包名

# 安装openssl-dev
sudo apt-get install openssl
sudo apt-get install libssl-dev
# 安装libxml2-dev
sudo apt-get install libxml2-dev
# 安装libev-dev
sudo apt-get install libev-dev
# 安装libjemalloc-dev
sudo apt-get install libjemalloc-dev
# 安装python-dev
sudo apt-get install python-dev
# 安装systemd
sudo apt-get install systemd
# 安装libc-ares
sudo apt-get install libc-ares2
# 其他依赖库的下载、编译及安装
wget https://c-ares.haxx.se/download/c-ares-1.12.0.tar.gz -O /tmp/c-ares.tar.gz
mkdir -p /tmp/c-ares
tar -zxvf /tmp/c-ares.tar.gz -C /tmp/c-ares --strip-components=1
cd /tmp/c-ares && ./configure --libdir=/usr/lib64
make
sudo make install
wget http://www.digip.org/jansson/releases/jansson-2.9.tar.gz -O /tmp/jansson.tar.gz
mkdir -p /tmp/jansson
tar -zxvf /tmp/jansson.tar.gz -C /tmp/jansson --strip-components=1
cd /tmp/jansson && ./configure --libdir=/usr/lib64
make
make check
sudo make install
``````
安装nghttp2服务。
``````shell
cd nghttp2-1.29.0
./configure --enable-app
make
make install
``````
如果中途没有报错即为安装成功，详情可仔细检查控制台输出。

检查一下是否能够执行文件。
``````shell
nghttp
nghttpd
nghttpx
# 如果没有提示command not found即为成功
``````
nghttp为client，nghttpd为server，nghttpx为reverse proxy。此处附带nghttpx的简易用法。
``````
# nghttpx可为后端服务器加上http2支持与SSL支持。
# -f参数后带上监听IP以及端口，-b参数后带上后端IP地址及端口，最后两个参数分别为私钥、证书。
# 默认配置为前端启用SSL，后端禁用SSL。
# 详细配置见https://www.nghttp2.org/documentation/nghttpx-howto.html
nghttpx -f0.0.0.0,8080 -b127.0.0.1,9091 /path/to/priv.key /path/to/full.crt
``````
 _参考：[http://www.bubuko.com/infodetail-1968389.html](http://www.bubuko.com/infodetail-1968389.html) （非安全链接）_