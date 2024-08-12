---
title: Ubuntu 18.04搭建邮箱笔记(Postfix+Dovecot+mySQL)
description: （别问，问就是懒得写摘要了）
tags:
  - Ubuntu
  - 邮箱
id: '41'
categories:
  - - 折腾笔记
date: 2020-06-19 22:37:00
---

由于服务器数据迁移，论坛注册时发送验证码用的邮箱配置废掉了。趁着五一假期有空，先在目前这台服务器上把他搞上。

为了安全起见及日后扩展需求，这次采用了虚拟用户的方案，也就是借助SQL来实现多域、多用户。和以往一样，这次也是使用了TLS。

搭建过程主要参考了这位老哥的文章：[https://www.cnblogs.com/renweihang/p/7988591.html](https://www.cnblogs.com/renweihang/p/7988591.html)，总体质量不错，适用于Ubuntu 18.04。注意里面mysql连接的host值127.0.0.1切勿自行改写成写成localhost，经过测试会有连接失败的问题。此外，涉及到的pem/key文件路径均位于```/etc/dovecot/private```下，而不是一个位于dovecot，另一个在dovecot/private，建议改为有效的证书文件，否则部分邮箱客户端会禁止登录（当然如果只是像我这样发个验证码啥的那没啥问题）。

此外，单域名用户为了确保邮件的合规性，建议在```/etc/postfix/main.cf```中如下设置：
``````conf
myhostname = \[默认主机名，或者为真实有效的域名，不要设置为localhost\]
mydomain = example.com　#修改为自己的域名
myorigin = $mydomain　 #将发信地址“@”后面的部分设置为域名（非系统主机名）
mydestination = $myhostname, localhost.$mydomain, localhost```
``````
#备注：原转载文章```mydestination```后有```$mydomain```，但是加上之后会导致```status=bounced```错误，参见https://stackoverflow.com/questions/18377813/postfix-status-bounced-unknown-user-myuser。

#版权声明：本节段节选自为CSDN博主「qinzhiguo003」的原创文章，遵循CC 4.0 by-sa版权协议，转载请附上原文出处链接及本声明。
#原文链接：https://blog.csdn.net/hitabc141592/article/details/25986911

为了启用TLS传输，同时保留在其他域不支持TLS时的通信能力，需要在```/etc/postfix/main.cf```中添加以下两行：
``````conf
#建议设置成may，如果设置成yes则另一端不支持加密时将无法通信
smtpd\_tls\_security\_level = may
smtp\_tls\_security\_level = may
``````
对于上述文章中提及的```/etc/postfix/mysql-virtual-mailbox-maps.cf```等配置文件，可能会导致部分机器出现问题。可以更改为如下配置：
``````conf
##/etc/postfix/mysql-virtual-mailbox-domains.cf
user = mailserver
password = mailserver123
#下面的hosts建议注释，尤其是对于mysql设置监听了localhost然而实际只监听了ipv6地址的情况（mariadb目前仍不支持设置监听域名或者监听多个IP）；官方文档也没有提及hosts的设置项。
#hosts = 127.0.0.1
dbname = mailserver
query = SELECT name FROM virtual\_domains WHERE name='%s'

##/etc/postfix/mysql-virtual-mailbox-maps.cf
user = mailserver
password = mailserver123
#hosts = 127.0.0.1
dbname = mailserver
query = SELECT '%u' FROM virtual\_users WHERE email='%s'

##/etc/postfix/mysql-virtual-alias-maps.cf
user = mailserver
password = mailserver123
#hosts = 127.0.0.1  
dbname = mailserver
query = SELECT destination FROM virtual\_aliases WHERE source='%s'
``````
在对垃圾邮件管控愈加严格的形势下，部分邮箱已经开始拒收无SPF/DKIM域名发送的邮件。我参考了这篇文章（[https://www.linuxbabe.com/mail-server/setting-up-dkim-and-spf](https://www.linuxbabe.com/mail-server/setting-up-dkim-and-spf)）设置了SPF和DKIM。以及这篇文章（[https://www.linuxbabe.com/mail-server/create-dmarc-record](https://www.linuxbabe.com/mail-server/create-dmarc-record)）设置了DMARC。

在我这儿生成的default.txt与示例中及百度到的几篇文章格式有所不同。我的是如下所示，p字段后有两端字符串，而示例中仅有一串。要粘贴的是括号内的内容，提示非法字符就把那几个空格给删掉然后自己重新敲一个进去。
``````shell
cat /etc/opendkim/keys/easysvc.xyz/default.txt
``````

``````
#结果如下所示
default.\_domainkey      IN      TXT     ( "v=DKIM1; h=sha256; k=rsa; "
          "p=MIIBIjANBgkqhkiG9w0FKELSUOCAQ8AMIIBCgKBWKSU8HfBNYVwEGVBQqumwRNlIYNLxczpfNYd2Mqiukv8Rr8yYL8J8ymdV2LYWbv41HL4MM251SMyzNPCrJKslXYKrxNgFCK/nTmRlRuRg8uiewhlcXJndCO4hkIA+Ek71sMCszDM07uZE0Niv49G3dMecTWGisrprnlnDmn4W1O62c6oQcyibakacPUSLDlnFfu3b1erR+0AAPhHRy"
          "AFEbX99S3BrsI+PYxPJ8h4gItD1I30CvX2iNdfuUfdMiH00tH5gT5ur9e6jcqbwdwE1CvNYz+hskMeY0IGbcjFIZaK7Q02e4t3x7AuP22dbgfBlN/iXxpl4m5kAGc3sfswwFPvBAQDKWUS" )  ; ----- DKIM key default for easysvc.xyz
``````
之前还参考过[linode](https://www.linode.com/docs/email/postfix/email-with-postfix-dovecot-and-mysql/)的一篇文章，弄完发现有坑（好像是因为适用于老版本软件）。[腾讯云](https://cloud.tencent.com/developer/article/1341463)的那片中文文章几乎就是linode那篇的翻版，注意别踩坑了。但是有个验证有效性的措施倒是很周到。
``````shell
sudo apt install mailutils

# 请确保已配置dkim/spf，否则邮件会被Gmail直接拒收，用户即使在垃圾箱内也看不到邮件

#测试发件功能
echo "Email body text"  sudo mail -s "Email subject line" recipient@gmail.com -aFrom:email1@example.com

#测试收件功能
#使用其他邮箱向已配置的账户发送邮件
sudo mail -f /var/mail/vhosts/example.com/email1
#如有邮件，此时会予以显示
``````
遇到些疑难杂症先看看自己配置有没有写错，然后百度谷歌，再没有的话试着直接翻Postfix/Dovecot的Document。

有问题请查看log。
``````shell
tail /var/log/mail.log
``````
如果一切排查无误，可以通过[https://www.mail-tester.com/](https://www.mail-tester.com/)来测试您的邮件得分了。

进阶操作——使用SpamAssassin来过滤垃圾邮件

CentOS/RHEL搭建过程参考[本篇文章](https://janikarhunen.fi/tackle-spam-with-spamassassin-on-centos-7-and-postfix)（需要一定的英语阅读能力/借用翻译）。  
Ubuntu/Debian搭建过程参照[本篇文章](https://www.binarytides.com/install-spamassassin-with-postfix-dovecot/)（未经验证，我在更新这一部分的时候从Ubuntu换到CentOS了）。

如果有问题，还可以参考如下几篇官方文档：  
http://www.postfix.org/VIRTUAL\_README.html  
http://www.postfix.org/MYSQL\_README.html  
http://www.postfix.org/postconf.5.html#virtual\_mailbox\_domains  
http://www.postfix.org/LOCAL\_RECIPIENT\_README.html