---
title: OpenVZ虚拟机使用tb-tun添加IPv6隧道
tags:
  - IPv6
  - OpenVZ
id: '29'
categories:
  - - 折腾笔记
date: 2019-02-06 22:18:00
---

> 注意：本方法需要VPS有TUN/TAP支持，如果不支持，请在管理面板内开启。如果没有此选项，可以提交工单。

近期服务端有使用ipv6的需求，然而普通办法需要服务器有sit0支持，但是提交工单也不给开。所以用了tb-tun。

条件：linux VPS, 具有独立公网IP

首先，在TunnelBroker上注册账户（请不要使用Chrome的移动端视图申请，可能会失败），然后点击”Create Regular Tunnel”申请普通IPV6隧道。需填入VPS的公网IP，以及选择一个节点。我选择的是距离服务器较近的纽约节点。

如此操作之后，隧道即申请开通完毕。你应该能看到如图所示的输入，其中Server IPv4 address以及Clients ipv6 address是需要用的。如果你有路由需求，可以assign routed /64。

tb-tun已经数年无人维护，不过还是处于可用的状态。需要从git并且编译。

git clone https://github.com/acgrid/tb-tun
cd tb-tun
gcc tb\_userspace.c -l pthread -o tb\_userspace

然后把生成的tb\_userspace移动到$PATH内。  
创建/etc/init.d/ipv6tb，按照以下范例编辑。

#! /bin/sh
### BEGIN INIT INFO
# Provides:          ipv6
# Required-Start:    $local\_fs $all
# Required-Stop:     $local\_fs $network
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: starts the ipv6 tunnel 
# Description:       ipv6 tunnel start-stop-daemon
### END INIT INFO
# /etc/init.d/ipv6tb
touch /var/lock/ipv6tb
case "$1" in
  start)
    echo "Starting ipv6tb "
      setsid /path/to/tb\_userspace tb SERVER\_IPV4\_ADDRESS CLIENTS\_IPV4\_ADDRESS sit > /dev/null 2>&1 &
      sleep 3s # ugly, but doesn't seem to work at startup otherwise
      ifconfig tb up
      ifconfig tb inet6 add CLIENTS\_IPV6\_ADDRESS # Add as many of these as you need from your routed /64 allocation
      ifconfig tb mtu 1480
      route -A inet6 add ::/0 dev tb
      route -A inet6 del ::/0 dev venet0
      ip -6 route del default dev venet0
    ;;
  stop)
    echo "Stopping ipv6tb"
      ifconfig tb down
      route -A inet6 del ::/0 dev tb
      killall tb\_userspace
    ;;
  \*)
    echo "Usage: /etc/init.d/ipv6tb startstop"
    exit 1
    ;;
esac
exit 0

编辑完成、设置权限后，ubuntu系统可以

update-rc.d ipv6tb defaults 99

然后就可以

service ipv6tb start

接下来是常规的测试步骤，包括服务端ping其他ipv6地址以及ping服务端ipv6地址。正常情况下两个应该都可以的。