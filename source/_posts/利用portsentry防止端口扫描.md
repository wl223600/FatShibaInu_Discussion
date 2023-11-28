---
title: 利用PortSentry防止端口扫描
tags:
  - Linux
  - VPS
id: '24'
categories:
  - - 折腾笔记
date: 2019-02-02 22:13:00
---

TODO:更新fail2ban+portsentry的组合用法。管他呢，先鸽着。

本文简单记载了VPS使用PortSentry安装及设置过程。

首先，从[这里](https://sourceforge.net/projects/sentrytools/files/latest/download)下载最新版本的PortSentry（吐槽一下，作者已经停更很久了，然而安装过程的bug没修复就撤了这算啥）。

wget https://sourceforge.net/projects/sentrytools/files/latest/download
tar zxvf download
cd portsentry-beta

然后，进行bug的修复。打开portsentry.c，定位到大约1584行的位置，按照下面所示将两行合并为一行。

vim portsentry.c

printf ("Copyright 1997-2003 Craig H. Rowland &lt;craigrowland at users dot sourceforget dot net&gt;\\n");

下面按照惯例操作~

#make <systype>
#<systype>可以是下面的任意一个，根据自己系统类型决定。
#linux, debian-linux, bsd, solaris, hpux, hpux-gcc, freebsd, osx, openbsd, netbsd, bsdi, aix, osf, irix, generic

make linux
make install

对于Ubuntu，手动安装之后的正常配置位于下面的位置：

/usr/local/psionic/portsentry

**编辑配置文档**

vim /usr/local/psionic/portsentry/portsentry.conf

Port Configurations

这一端列出了默认的监视的端口，可以通过去掉#号来执行默认的配置，可以自行修改。

\# Port Configurations
# Un-comment these if you are really anal:
#TCP\_PORTS="1,7,9,11,15,70,79,80,109,110,111,119,138,139,143,512,513,514,515,540,635,1080,1524,2000,2001,4000,4001,5742,6000,6001,6667,12345,12346,20034,27665,30303,32771,32772,32773,32774,31337,40421,40425,49724,54320"
#UDP\_PORTS="1,7,9,66,67,68,69,111,137,138,161,162,474,513,517,518,635,640,641,666,700,2049,31335,27444,34555,32770,32771,32772,32773,32774,31337,54321"
#
# Use these if you just want to be aware:
TCP\_PORTS="1,11,15,79,111,119,143,540,635,1080,1524,2000,5742,6667,12345,12346,20034,27665,31337,32771,32772,32773,32774,40421,49724,54320,51010"
UDP\_PORTS="1,7,9,69,161,162,513,635,640,641,700,37444,34555,31335,32770,32771,32772,32773,32774,31337,54321"
#
# Use these for just bare-bones
#TCP\_PORTS="1,11,15,110,111,143,540,635,1080,1524,2000,12345,12346,20034,32771,32772,32773,32774,49724,54320"
#UDP\_PORTS="1,7,9,69,161,162,513,640,700,32770,32771,32772,32773,32774,31337,54321"

Advanced Stealth Scan Detection Options

\# Advanced Stealth Scan Detection Options
ADVANCED\_PORTS\_TCP="1024"
ADVANCED\_PORTS\_UDP="1024"
# Default TCP ident and NetBIOS service
ADVANCED\_EXCLUDE\_TCP="113,139"
# Default UDP route (RIP), NetBIOS, bootp broadcasts.
ADVANCED\_EXCLUDE\_UDP="520,138,137,67"

Configuration Files；portsentry.conf 相关的配置文件

\# Configuration Files
# Hosts to ignore
#（ 此文件记录允许合法扫描服务的主机地址 ）
IGNORE\_FILE="/usr/local/psionic/portsentry/portsentry.ignore"
# Hosts that have been denied (running history)
#（ 此文件中保留入侵主机的 IP 地址 ）
HISTORY\_FILE="/usr/local/psionic/portsentry/portsentry.history"
# Hosts that have been denied this session only (temporary until next restart)
# （ 此文件中是已经被阻止连接的主机 IP 记录 ）
BLOCKED\_FILE="/usr/local/psionic/portsentry/portsentry.blocked"

Dropping Routes

丢弃规则，也就是路由重定向，设置一条虚拟的路由记录，把数据包重定向到一个不存在的主机，根据不同的操作系统，选择不同的命令。软件作者已在注释中说明，请不要使用333.444.555.666，而是使用本地子网中一个不存在的地址；在一些主机上，使用127.0.0.1有着相同的效果。

\# Dropping Routes
# Generic
#KILL\_ROUTE="/sbin/route add $TARGET$ 333.444.555.666"
# Generic Linux
KILL\_ROUTE="/sbin/route add -host $TARGET$ gw 333.444.555.666"
# Newer versions of Linux support the reject flag now. This
# is cleaner than the above option.
#KILL\_ROUTE="/sbin/route add -host $TARGET$ reject"
# Generic BSD (BSDI, OpenBSD, NetBSD, FreeBSD)
#KILL\_ROUTE="/sbin/route add $TARGET$ 333.444.555.666"
# Generic Sun
#KILL\_ROUTE="/usr/sbin/route add $TARGET$ 333.444.555.666 1"
# NEXTSTEP
#KILL\_ROUTE="/usr/etc/route add $TARGET$ 127.0.0.1 1"
# FreeBSD
#KILL\_ROUTE="route add -net $TARGET$ -netmask 255.255.255.255 127.0.0.1 -blackhole"
# Digital UNIX 4.0D (OSF/1 / Compaq Tru64 UNIX)
#KILL\_ROUTE="/sbin/route add -host -blackhole $TARGET$ 127.0.0.1"
# Generic HP-UX
#KILL\_ROUTE="/usr/sbin/route add net $TARGET$ netmask 255.255.255.0 127.0.0.1"

根据配置文件记录下的 IP，使用 iptables 阻塞掉，切断与其连接

##
# Using a packet filter is the PREFERRED. The below lines
# work well on many OS's. Remember, you can only uncomment \*one\*
# KILL\_ROUTE option.
# ipfwadm support for Linux
#KILL\_ROUTE="/sbin/ipfwadm -I -i deny -S $TARGET$ -o"
#
# ipfwadm support for Linux (no logging of denied packets)
#KILL\_ROUTE="/sbin/ipfwadm -I -i deny -S $TARGET$"
#
# ipchain support for Linux
#KILL\_ROUTE="/sbin/ipchains -I input -s $TARGET$ -j DENY -l"
#
# ipchain support for Linux (no logging of denied packets)
#KILL\_ROUTE="/sbin/ipchains -I input -s $TARGET$ -j DENY"
#
# iptables support for Linux
#KILL\_ROUTE="/usr/local/bin/iptables -I INPUT -s $TARGET$ -j DROP"
#
# For those of you running FreeBSD (and compatible) you can
# use their built in firewalling as well.
#
#KILL\_ROUTE="/sbin/ipfw add 1 deny all from $TARGET$:255.255.255.255 to any"
#
# For those running ipfilt (OpenBSD, etc.)
# NOTE THAT YOU NEED TO CHANGE external\_interface TO A VALID INTERFACE!!
#
#KILL\_ROUTE="/bin/echo 'block in log on external\_interface from $TARGET$/32 to any'  /sbin/ipf -f -"

**或者**，可以把攻击者的 IP 记录到/etc/hosts.deny中，利用 TCP\_Wrappers机制防止被攻击。如果需要与fail2ban联动，建议注释掉下面的内容，因为fail2ban本身可定制更为灵活的处理策略。

\# TCP Wrappers
#
KILL\_HOSTS\_DENY="ALL: $TARGET$"

定制警告信息，警告攻击者

\# Port Banner Section
#
#
# Enter text in here you want displayed to a person tripping the PortSentry.
# I \*don't\* recommend taunting the person as this will aggravate them.
# Leave this commented out to disable the feature
#
# Stealth scan detection modes don't use this feature
#
#PORT\_BANNER="\*\* UNAUTHORIZED ACCESS PROHIBITED \*\*\* YOUR CONNECTION ATTEMPT HAS BEEN LOGGED. GO AWAY."

修改portsentry.ignore的配置文件

文件`/usr/local/psionic/portsentry/portsentry.ignore`配置上本地的 IP 和 常建立连接的主机，允许合法扫描。配置好之后最好修改一下 `/usr/local/psionic/portsentry/portsentry.conf`和`/usr/local/psionic/portsentry/portsentry.ignore`的权限。

chmod 600 /usr/local/psionic/portsentry/portsentry.conf
chmod 600 /usr/local/psionic/portsentry/portsentry.ignore

**开启监测模式**

PortSentry的启动检测模式。对应TCP和UDF两种协议方式，PortSentry分别有三种启动模式，即基本、秘密和高级秘密扫描检测模式，合计6个模式。

*   portsentry-tcp，TCP的基本端口绑定模式；
*   portsentry-udp，UDP的基本端口绑定模式；
*   portsentry-stcp，TCP的秘密扫描检测模式；
*   portsentry-sudp，UDP的秘密扫描检测模式；
*   portsentry-atcp，TCP的高级秘密扫描检测模式；
*   portsentry-audp，UDP的高级秘密扫描检测模式。

一般情况下，建议使用秘密扫描检测模式或高级秘密扫描检测模式。

使用高级秘密扫描检测模式（Advanced Stealth Scan Detection Mode），PortSentry会自动检查服务器上正在运行的端口， 然后把这些端口从配置文件中移去， 只监控其它的端口。这样会加快对端口扫描的反应速度，并且只占用很少的CPU时间，这种模式非常智能。

启动命令：

/usr/local/psionic/portsentry/portsentry -atcp

启动PortSentry后，并不会有任何前台消息输出，一切将在后台运行。此时可以利用一些站长工具来进行扫描测试。经过测试，笔者配置的PortSentry一切正常。

_来源：[简书-Tecooler](https://www.jianshu.com/p/3865f25daa00)_