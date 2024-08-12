---
title: Ubuntu 16.04 cpanm安装Authen::Libwrap时遇到的问题及解决方法
description: 又是刚入坑Linux时产生的某个幼稚笔记。
tags:
  - cpanm
  - Ubuntu
  - Webmin
id: '35'
categories:
  - - 折腾笔记
date: 2019-02-02 22:28:00
---

最近Webmin相关功能需要Authen::Libwrap，安装时遇到问题，输出日志如下：

cpanm (App::cpanminus) 1.7040 on perl 5.022001 built for x86\_64-linux-gnu-thread-multi
Work directory is /root/.cpanm/work/1525944650.23506
You have make /usr/bin/make
You have LWP 6.15
You have /bin/tar: tar (GNU tar) 1.28
Copyright (C) 2014 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Written by John Gilmore and Jay Fenlason.
You have /usr/bin/unzip
Searching Authen::Libwrap () on cpanmetadb ...
--> Working on Authen::Libwrap
Fetching http://www.cpan.org/authors/id/D/DM/DMUEY/Authen-Libwrap-0.23.tar.gz
-> OK
Unpacking Authen-Libwrap-0.23.tar.gz
Entering Authen-Libwrap-0.23
Checking configure dependencies from META.json
Checking if you have ExtUtils::Install 1.46 ... Yes (2.04)
Checking if you have Module::Build 0.42 ... Yes (0.4216)
Configuring Authen-Libwrap-0.23
Running Build.PL
enter include directory to use: \[/usr/include \]/usr/include
enter library directory to use: \[/usr/lib \]/usr/lib
Created MYMETA.yml and MYMETA.json
Creating new 'Build' script for 'Authen-Libwrap' version '0.23'
-> OK
Checking dependencies from MYMETA.json ...
Checking if you have ExtUtils::CBuilder 0 ... Yes (0.280221)
Checking if you have Test::More 0 ... Yes (1.001014)
Checking if you have Scalar::Util 0 ... Yes (1.41)
Checking if you have Test::Exception 0 ... Yes (0.43)
Building and testing Authen-Libwrap-0.23
Building Authen-Libwrap
Error: Function definition too short '/ \* EOF \* /' in Libwrap.xs, line 32
x86\_64-linux-gnu-gcc -I/usr/lib/x86\_64-linux-gnu/perl/5.22/CORE -DXS\_VERSION="0.23" -DVERSION="0.23" -fPIC -I/usr/include -c -D\_REENTRANT -D\_GNU\_SOURCE -DDEBIAN -fwrapv -fno-strict-aliasing -pipe -I/usr/local/include -D\_LARGEFILE\_SOURCE -D\_FILE\_OFFSET\_BITS=64 -O2 -g -o lib/Authen/Libwrap.o lib/Authen/Libwrap.c
lib/Authen/Libwrap.xs:9:18: fatal error: tcpd.h: No such file or directory
compilation terminated.
error building lib/Authen/Libwrap.o from 'lib/Authen/Libwrap.c' at /usr/share/perl/5.22/ExtUtils/CBuilder/Base.pm line 173.
-> FAIL Installing Authen::Libwrap failed. See /root/.cpanm/work/1525944650.23506/build.log for details. Retry with --force to force install it.

解决方法很简单：

sudo apt-get install libwrap0 libwrap0-dev

然后重新尝试即可。