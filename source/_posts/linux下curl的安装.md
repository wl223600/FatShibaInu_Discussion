---
title: linux下curl的安装
tags:
  - curl
  - Ubuntu
id: '37'
categories:
  - - 折腾笔记
date: 2019-02-02 22:32:00
---

笔者使用的Ubuntu正常情况下是带有curl的，不过近期由于需要检测网站http2支持，要升级curl版本。本文详细讲解curl的一般安装过程。

以发表日前发布的最新版7.57.0示例。

# 安装编译工具
``````shell
sudo apt-get install git g++ make binutils autoconf automake autotools-dev libtool pkg-config \\
  zlib1g-dev libcunit1-dev libssl-dev libxml2-dev libev-dev libevent-dev libjansson-dev \\
  libjemalloc-dev cython python3-dev python-setuptools
# 下载、编译、安装curl
wget https://curl.haxx.se/download/curl-7.57.0.tar.bz2
tar -jxvf curl-7.57.0.tar.bz2
cd curl-7.57.0
./configure
make
make install
``````

至此，curl正常情况下应该安装完毕。可以输入
``````shell
curl --version
``````
查看详情。如果输出显示如下例所示即为成功：
``````
curl 7.57.0 (i686-pc-linux-gnu) libcurl/7.57.0 LibreSSL/2.5.4 zlib/1.2.8 libssh2/1.4.3 nghttp2/1.29.0
Release-Date: 2017-11-29
Protocols: dict file ftp ftps gopher http https imap imaps pop3 pop3s rtsp scp sftp smb smbs smtp smtps telnet tftp
Features: AsynchDNS IPv6 Largefile NTLM NTLM\_WB SSL libz HTTP2 UnixSockets HTTPS-proxy
``````
不过笔者一开始显示的却是这样子：
``````
curl 7.57.0 (i686-pc-linux-gnu) libcurl/7.35.0 OpenSSL/1.0.1f zlib/1.2.8 libidn/1.28 librtmp/2.3
Release-Date: 2017-11-29
Protocols: dict file ftp ftps gopher http https imap imaps ldap ldaps pop3 pop3s rtmp rtsp smtp smtps telnet tftp
Features: AsynchDNS IDN IPv6 Largefile NTLM NTLM\_WB SSL libz TLS-SRP
``````
有没有发现画风不对？问题就出在libcurl的版本上（也有同学是curl出的问题）。而且输入
``````
curl --http2 -I https://nghttp2.org
``````
检测会出现如下问题。
``````
curl: (48) An unknown option was passed in to libcurl
``````
根据搜索结果及自身实践，这是系统内置curl与用户安装curl共存导致的问题，可以按照下面办法解决：  
（1）curl版本有误  
检查/usr/bin和/usr/local/bin目录是否有多个版本的curl。

\# 提示：可以使用下面的命令全盘检索文件。
``````
locate -r <FileName> # <FileName>是你要检索的文件（夹）名称
# 如果报错，可以使用下面的命令更新检索数据库。
updatedb

locate -r /curl$
``````
然后删除多余的curl（一般删除系统内置的版本，先根据文件日期等信息进行判断，一般情况下编译安装的版本为当前日期）。  
如果删除后报错，用ln -s命令把新安装curl的位置链接过去。

（2）libcurl版本有误

检查/usr/lib和/usr/local/lib目录是否有多个版本的curl。
``````
locate -r /curl$
``````
笔者的系统内置libcurl为/usr/lib/i386-linux-gnu/libcurl.so.4。为了避免麻烦，故直接删除并把新文件链接过去。
``````
rm /usr/lib/i386-linux-gnu/libcurlso.4
ln -s /usr/local/lib/libcurl.so.4 /usr/lib/i386-linux-gnu/libcurlso.4
``````
完成后检查，问题解决。测试得到如下回复：
``````
curl --http2 -I https://nghttp2.org
HTTP/2 200
date: Wed, 17 Jan 2018 13:21:28 GMT
content-type: text/html
last-modified: Tue, 19 Dec 2017 14:35:15 GMT
etag: "5a3923a3-19d8"
accept-ranges: bytes
content-length: 6616
x-backend-header-rtt: 0.001803
strict-transport-security: max-age=31536000
server: nghttpx
via: 2 nghttpx
x-frame-options: SAMEORIGIN
x-xss-protection: 1; mode=block
x-content-type-options: nosniff
``````
提示：版本有误的问题，可能需要根据系统实际情况进行操作，不建议直接照搬本文讲述的过程。

对于安装curl后系统内置cmake报错的问题，请卸载内置cmake，并编译安装新版本即可（不要通过apt-get安装）。

Ubuntu版本：14.04 x86