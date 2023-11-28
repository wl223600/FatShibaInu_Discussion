---
title: WordPress速度优化历程
tags:
  - Nginx
  - Pagespeed
  - Wordpress
id: '45'
categories:
  - - 折腾笔记
date: 2020-06-17 22:45:00
---

博客建立的第一年，我主要采用WP插件的方式优化访问速度，效果不错但是反应速度仍然偏慢，换VPS了正好又是寒假，想着手解决一下这个问题。这篇文章记录了各个阶段使用的方法及其效果。**如果想查看本站目前使用的解决方案，直接翻到最后一页即可。**

## Stage One

*   使用插件：Autoptimize

这款插件功能挺多的，能自动优化HTML/Javascript/CSS。对于兼容性比较好的主题，全部勾上基本没问题了。

然而用完之后，访问速度还是很慢，所以我开始质疑这款插件的效果（后来发现是自己太幼稚了，那台OpenVZ不能开BBR，1G内存而且疑似高度超售，php能跑得快、网速好才怪呢）。

## Stage Two

*   使用插件：Autoptimze、Async Javascript、Redis object cache
*   <head>修改：preload、preconnect（手动修改）
*   主题文件修改（解决国内Google Font不可用的问题）

后来在折腾缓存的时候，偶然发现Redis可以用来给Wordpress加速（一开始也想搞memcache的，发现这台宝塔面板的机子做个Redis然后给WP装个插件弄起来更方便一点）。

一开始我想不靠这些插件轻装上阵，然而发现Wordpress的臃肿不是闹着玩的，Jetpack这种有免费图像缓存、Downtime监视功能的插件又不能不要，目光又回到了WordPress插件上。

![](https://easysvc.xyz/wp-content/uploads/pagespeed-insight.png)

同时在这个阶段我又发现了[PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights)，可以方便地对网站性能情况进行打分。或者，使用另一款[GTmetrix](https://gtmetrix.com/)，虽然高峰时期未注册用户要排队测试，但是不像PageSpeed Insights成绩会抽风，而且给出一些莫名其妙让人哭笑不得的优化建议（例如指出Google自家Analytics、AdSense在网页中内嵌的js需要优化等，自己打自己的脸，充分展示了大厂的宫斗风）。

测试过程中又穿插上解决国内google fonts无法使用的问题，根据浏览器页面的html源码（字体名称）在主题php中找到了字体加载路径，在未被墙的主机上下载了字体文件并上传到服务器上，替换掉主题php中的路径，搞定。顺便搞了波  
font-display: fallback; ，（虽然对主题中的material-icons并没有什么卵用，但是评测分数提升了一些）。

Preload通俗来说就是告知浏览器，网页会在后面用到一些资源，可以提前进行下载。preload字体的话，直接在<head>里写就行（能插header的插件市场里一堆，就连管广告的Ad Inserter都带个修改header/footer的功能），我参考了[这里](https://www.jianshu.com/p/24ffa6d45087)（这篇文章详细介绍了preload的各种用法），在<head>里插入了下面几行代码：

<!--
请根据自己站点使用的字体信息编辑如下内容
-->
<link rel="preload" href="/wp-content/themes/realistic/font/KFOmCnqEu92Fr1Mu4mxK.woff2" as="font" type="font/woff2" crossorigin/>
<link rel="preload" href="/wp-content/themes/realistic/font/KFOlCnqEu92Fr1MmSU5fBBc4.woff2" as="font" type="font/woff2" crossorigin/>
<link rel="preload" href="/wp-content/themes/realistic/font/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2" as="font" type="font/woff2" crossorigin/>

此外，还有preconnect，作用是写在<head>里，让客户端提前连接站点，减少加载时间。和下文pagespeed的dns-prefetch有相似之处，但dns-prefetch只是查询DNS，并不连接。

<!--
域名列表请根据自己的情况填写
-->
<link href='https://1.gravatar.com' rel=preconnect />
<link href='https://secure.gravatar.com' rel=preconnect />
<link href='https://adservice.google.com' rel=preconnect />
<link href='https://www.googletagmanager.com' rel=preconnect />
<link href='https://www.googletagservices.com' rel=preconnect />
<link href='https://www.google-analytics.com' rel=preconnect />
<link href='https://pagead2.googlesyndication.com' rel=preconnect />
<link href='https://tpc.googlesyndication.com' rel=preconnect />
<link href='https://stats.wp.com' rel=preconnect />
<link href='https://widgets.wp.com' rel=preconnect />
<link href='https://c0.wp.com' rel=preconnect />
<link href='https://i0.wp.com' rel=preconnect />
<link href='https://i1.wp.com' rel=preconnect />
<link href='https://i2.wp.com' rel=preconnect />
<link href='https://s.wp.com' rel=preconnect />
<link href='https://s0.wp.com' rel=preconnect />
<link href='https://s1.wp.com' rel=preconnect />
<link href='https://s2.wp.com' rel=preconnect />
<link href='https://pixel.wp.com' rel=preconnect />
<link href='https://public-api.wordpress.com' rel=preconnect />
<link href='https://www.gravatar.com' rel=preconnect />
<link href='https://googleads.g.doubleclick.net' rel=preconnect />

详细配置之后，分数从初始40分左右提高到56分（移动端）。扣分项主要还是TTFB和阻塞渲染的时长这两项。

## Stage Three

![](https://easysvc.xyz/wp-content/uploads/ngx_pagespeed.png)

*   Nginx模块：[ngx\_pagespeed](https://developers.google.com/speed/pagespeed/module/?hl=zh-CN)（其实pagespeed也有Apache的Module）
*   插件：Redis object cache
*   <head>修改：preload、preconnect （手动修改）

用了Cloudflare，56分的成绩在国内某些网络下（没错，说的就是你这个辣鸡联通，就是因为你，Cloudflare成了名副其实的减速CDN）是远远不够用的，还得再找提分点。偶然的机会盯上了pagespeed模块。谷歌出品，必属精品BBR就是谷歌出的一款服务器module，所以想着试试。

Ubuntu 18.04的安装过程（安装前请在[此处](https://www.modpagespeed.com/doc/release_notes)查看最新版本，推荐使用稳定版）：

sudo apt-get install build-essential zlib1g-dev libpcre3 libpcre3-dev unzip uuid-dev

#推荐不要再动除了NPS\_VERSION以外的其他内容。
#\[check the release notes for the latest version\]
NPS\_VERSION=1.13.35.2-stable
cd
wget https://github.com/apache/incubator-pagespeed-ngx/archive/v${NPS\_VERSION}.zip
unzip v${NPS\_VERSION}.zip
nps\_dir=$(find . -name "\*pagespeed-ngx-${NPS\_VERSION}" -type d)
cd "$nps\_dir"
NPS\_RELEASE\_NUMBER=${NPS\_VERSION/beta/}
NPS\_RELEASE\_NUMBER=${NPS\_VERSION/stable/}
psol\_url=https://dl.google.com/dl/page-speed/psol/${NPS\_RELEASE\_NUMBER}.tar.gz
\[ -e scripts/format\_binary\_url.sh \] &amp;&amp; psol\_url=$(scripts/format\_binary\_url.sh PSOL\_BINARY\_URL)
wget ${psol\_url}
tar -xzvf $(basename ${psol\_url})  # extracts to psol/

既然是nginx原来没有的module，当然要下载nginx源码重新编译安装啦，因为我用的宝塔面板，所以找到nginx源码位置/www/server/nginx/src。

cd /www/server/nginx/src
#需要查看原来安装的nginx的配置
nginx -V
#会出现一些代码，直接复制，然后./configure时在末尾加上--add-module=$HOME/$nps\_dir ${PS\_NGX\_EXTRA\_FLAGS}
#安装前推荐关闭nginx
sudo service nginx stop
./configure --user=www --group=www --prefix=/www/server/nginx --with-openssl=/www/server/nginx/src/openssl --add-module=$HOME/$nps\_dir ${PS\_NGX\_EXTRA\_FLAGS} --add-module=/www/server/nginx/src/ngx\_devel\_kit --add-module=/www/server/nginx/src/lua\_nginx\_module --add-module=/www/server/nginx/src/ngx\_cache\_purge --add-module=/www/server/nginx/src/nginx-sticky-module --with-http\_stub\_status\_module --with-http\_ssl\_module --with-http\_v2\_module --with-http\_image\_filter\_module --with-http\_gzip\_static\_module --with-http\_gunzip\_module --with-stream --with-stream\_ssl\_module --with-ipv6 --with-http\_sub\_module --with-http\_flv\_module --with-http\_addition\_module --with-http\_realip\_module --with-http\_mp4\_module --with-ld-opt=-Wl,-E --with-openssl-opt='enable-tls1\_3 enable-weak-ssl-ciphers' --with-ld-opt=-ljemalloc --with-cc-opt=-Wno-error
make
sudo make install

#备注：pagespeed也支持以dynamic module的方式被编译及加载，关于dynamic module的详细信息请参考nginx文档。

（其他系统的安装及配置步骤目前从略，请参考[此处](https://www.modpagespeed.com/doc/build_ngx_pagespeed_from_source)，现在只贴出部分server部分配置代码，但官方文档指出可以在http部分全局开启，然后各分站点详细配置；更详细的配置选项请参考[官网文档](https://www.modpagespeed.com/doc)。）

**警示：请仔细检查下面的配置是否符合站点需要，不正确的配置会导致资源无法访问或者应用运行缓慢。**

#启用Pagespeed
pagespeed on;

#配置共享内存元数据缓存
pagespeed CreateSharedMemoryMetadataCache "/var/ngx\_pagespeed\_cache/" 51200;
# Nginx对于缓存要可写。为了最佳性能，可以使用tmpfs（载入RAM中，不推荐RAM<1G设备使用）。
pagespeed FileCachePath /var/ngx\_pagespeed\_cache;
# 下面几个单位应该分别是KB/毫秒/个吧（CacheSize建议设置为站点总资源大小的5倍）
pagespeed FileCacheSizeKb            512000;
pagespeed FileCacheCleanIntervalMs   3600000;
pagespeed FileCacheInodeLimit        500000;

#Redis/Memcached请根据服务器实际，选择性开启，只能二选一。其中Redis支持为实验性功能，有长时间使用后Redis进程无故停止的报告，而且个人测试发现会使WP Super Cache优化的TTFB失效。
#pagespeed RedisServer "127.0.0.1:6379";
#pagespeed MemcachedServers "host1:port1,host2:port2,host3:port3";

# Content-Security-Policy 头部
pagespeed HonorCsp on;
# 压缩CSS
pagespeed EnableFilters rewrite\_css;
# 合并CSS
pagespeed EnableFilters combine\_css;
# 内嵌CSS
pagespeed EnableFilters inline\_css;
# Flatten CSS imports
pagespeed EnableFilters flatten\_css\_imports;
# 重写CSS，优化加载渲染页面的CSS规则
pagespeed EnableFilters prioritize\_critical\_css;
# 移动CSS至JS之上
pagespeed EnableFilters move\_css\_above\_scripts;
# 移动CSS到<head>中
pagespeed EnableFilters move\_css\_to\_head;
# google字体直接写入html 目的是减少浏览器请求和DNS查询
pagespeed EnableFilters inline\_google\_font\_css;
# 压缩js
pagespeed EnableFilters rewrite\_javascript;
# 合并js
pagespeed EnableFilters combine\_javascript;
# 延迟加载Javascript
pagespeed EnableFilters defer\_javascript;
# 内联Javascript
pagespeed EnableFilters inline\_javascript;
# 限制内联的js文件最大大小，便于大型js文件的静态缓存
pagespeed JsInlineMaxBytes 2560;
# 合并heads，只保留一个
pagespeed EnableFilters combine\_heads;
# 将http-equiv元信息转换成HTTP头
pagespeed EnableFilters convert\_meta\_tags;
# html字符转小写
pagespeed LowercaseHtmlNames on;
# 移除 html 空白
pagespeed EnableFilters collapse\_whitespace;
# 移除 html 注释
pagespeed EnableFilters remove\_comments;
# DNS 预加载
pagespeed EnableFilters insert\_dns\_prefetch;
# 优化内嵌样式属性
pagespeed EnableFilters rewrite\_style\_attributes;
# 压缩图片
pagespeed EnableFilters rewrite\_images;
# 不加载显示区域以外的图片
pagespeed EnableFilters lazyload\_images;
# 禁止在onload事件后立即加载图片（不推荐启用），在极端情况下（如多图页面）可能会导致用户体验极差
#pagespeed LazyloadImagesAfterOnload off;
# 图片预加载
pagespeed EnableFilters inline\_preview\_images;
# 移动端图片自适应重置
pagespeed EnableFilters resize\_mobile\_images;
# 响应式图像，需启用rewrite\_images
pagespeed EnableFilters responsive\_images;
# 增强响应式图像的功能，在用户放大时加载高分辨率图像。此项启用后会在页面内自动插入一段js以实现功能
#pagespeed EnableFilters responsive\_images\_zoom;
# 雪碧图片，图标很多的时候很有用
pagespeed EnableFilters sprite\_images;
# 扩展缓存 改善页面资源的可缓存性
pagespeed EnableFilters extend\_cache;
pagespeed XHeaderValue "Powered By ngx\_pagespeed";
pagespeed SupportNoScriptEnabled false;
# admin直接访问<域名>/pagespeed\_admin 就可以打开管理员界面了。
pagespeed Statistics on;
pagespeed StatisticsLogging on;
pagespeed LogDir /var/log/pagespeed;
pagespeed AdminPath /pagespeed\_admin;
pagespeed GlobalAdminPath /pagespeed\_global\_admin;
# 缩写站内链接地址
pagespeed EnableFilters trim\_urls;
# 复用页面内已经加载过的图片
pagespeed EnableFilters dedup\_inlined\_images;
# 当属性值等于默认值时，移除HTML文件中的这些值，减少流量且便于压缩
pagespeed EnableFilters elide\_attributes;
# 提示浏览器提前加载用到的JS/CSS
pagespeed EnableFilters hint\_preload\_subresources;
# 去除HTML中不必要的引号
pagespeed EnableFilters remove\_quotes;
# 去除HTML中的注释
pagespeed EnableFilters remove\_comments;
# 将对噪声敏感的非动画GIF/PNG转换为无损WebP
pagespeed EnableFilters convert\_to\_webp\_lossless;
# 将动画GIF转换为WebP
pagespeed EnableFilters convert\_to\_webp\_animated;
# 将静态GIF转换为PNG
pagespeed EnableFilters convert\_gif\_to\_png;
# 将非噪声敏感的PNG转换为JPG
pagespeed EnableFilters convert\_png\_to\_jpeg;
# 将非噪声敏感的JPG转换为WebP
pagespeed EnableFilters convert\_jpeg\_to\_webp;
# 允许清空缓存
pagespeed EnableCachePurge on;
# 无视no-transform，进行优化
pagespeed DisableRewriteOnNoTransform off;
# 优化JS引用的图片，注意可能会导致一些问题，如果有大量错误日志建议关闭
pagespeed InPlaceResourceOptimization on;
pagespeed EnableFilters in\_place\_optimize\_for\_browser;

# 设置LoadFromFile，直接从服务器本地加载文件，避免了模拟http访问时遇到的各种Cache Control问题
# 需要针对自己服务器的静态资源情况进行修改
pagespeed LoadFromFile "https://foo.yourdomain/virtual\_path" "/path/to/your/real/resources";

# pagespeed的EnableFilters是支持用","连接的，在nginx里可以写在http{}部分，只占用一行空间，且不用在server{}内重复配置，更为清爽。

警示：对于部分网页，上述功能全开会出现问题，需要详细调试加以排除。

然后我停用了插件，发现自己还是too young, too simple……几乎没什么卵用，阻塞渲染的资源还是那几个JS和死活搞不定的CSS。

## Stage Four

*   Nginx模块：[ngx\_pagespeed](https://developers.google.com/speed/pagespeed/module/?hl=zh-CN)
*   插件：Autoptimize、Redis object cache
*   <head>修改：Preload、Preconnect（手动修改）

于是又请回了Autoptimize，至于Async Javascript就不用了，因为pagespeed对js的异步加载处理的很好了。

在再次尝试Autoptimze启用CSS优化的时候发现存在主题样式错乱的问题，遂关闭之，单用JS优化足够了。

分数好像又高了那么一丢丢（或许是心理作用）。

## Stage Five

*   Nginx模块：[ngx\_pagespeed](https://developers.google.com/speed/pagespeed/module/?hl=zh-CN)
*   插件：Redis object cache、WP Super Cache
*   <head>修改：Preload、Preconnect（手动修改）

启用WP Super Cache，尝试从Wordpress层面生成静态页面，进一步优化TTFB。暴力地开启了预生成静态页面的功能，当爬虫/非注册用户访问的时候，直接提供已经生成的静态页面。最终优化TTFB到0.1秒左右（原来是1秒以上）。详细的非官方配置指导，请参照[这里](https://heikezhinan.com/wp-super-cache-configuration/)。

此外，在查看Pagespeed Console（Pagespeed唯独此页面需要“出国留学”）时，发现了下图所示信息。

![](https://easysvc.xyz/wp-content/uploads/pagespeed_console_capture_1-1024x576.jpg)

翻车现场1（Cache-Control没有设置为public\[默认为private\]）  
目前原因还不是很明确

![](https://easysvc.xyz/wp-content/uploads/pagespeed_console_capture_2-1024x576.jpg)

翻车现场2（严格来说不能算是翻车，因为外站资源没办法处理的，此处主要是由于使用了Jetpack的图像加速功能，但这及家伙在国内也是名副其实的减速功能，大量图像资源储存在外站）

![](https://easysvc.xyz/wp-content/uploads/pagespeed_console_capture_3-1024x576.jpg)

翻车现场3（尝试从缓存中加载时发现资源已过期）

想到自己博客上的资源是上传了就不会再动的，此外非本域名的一些内容Pagespeed似乎不会进行优化，所以进一步改进pagespeed配置以及nginx对特定资源的expire/Cache-Control设置尝试改善问题。

\# 为非本域名，但仍然由你掌控的资源优化（Authorizing domains），大致要求是添加的站点是由你控制的，也启用了pagespeed
# ！！！！！！！
# ！请根据自己网站实际情况进行调整
# ！否则会在console中出现大量
# ！“Resources not rewritten because domain wasn't authorized"错误。
# ！！！！！！！
# 
#pagespeed Domain https://foo.yourdomain.com;
#pagespeed Domain \*.yourdomain.com; #等效于http://\*.yourdomain.com
#不等效于https://\*.yourdomain.com;

# 下面的几种文件类型基本涵盖Wordpress的大多数内容了，请根据站点实际进行调整。
# expires 对于长期不变的资源设置长一点，或者直接max
# Cache-Control public一定要加上，否则pagespeed没办法缓存
# 注意pagespeed会自动把优化后的文件设置为Cache-Control : no-cache, max-age=0;
# 此行为会导致部分CDN无法正常缓存服务器的源文件，对此介意请设置：
#pagespeed ModifyCachingHeaders on;
# 对Wordpress效果不明显，疑似php资源无法缓存

location ~ .\*.(gifjpgjpegpngbmpswfico)$
{
add\_header Cache-Control public,max-age=5184000;
expires      60d;
}

location ~ .\*.(jscssjson)?$
{
add\_header Cache-Control public,max-age=2592000;
expires      30d;
}
    
location ~ .\*.(woffwoff2)$
{
    add\_header Cache-Control public,max-age=2592000;
expires30d;
}

此外，还可以改善gzip配置来尝试解决问题，也可以试试Brotli，和Pagespeed的配置方式一样，也需要编译安装（此处略）。

\# 当然写在nginx配置里啦
gzip on;
gzip\_min\_length 256;
gzip\_buffers 4 16k;
gzip\_http\_version 1.1;
gzip\_comp\_level 4;
gzip\_types
application/atom+xml
application/javascript
application/json
application/ld+json
application/manifest+json
application/rss+xml
application/geo+json
application/vnd.ms-fontobject
application/x-font-ttf
application/x-web-app-manifest+json
application/xhtml+xml
application/xml
application/rdf+xml
font/collection
font/opentype
font/otf
font/ttf
image/bmp
image/svg+xml
image/x-icon
text/cache-manifest
text/css
text/javascript
text/plain
text/vcard
text/vnd.rim.location.xloc
text/vtt
text/x-component
text/x-cross-domain-policy;
gzip\_vary on;
gzip\_proxied any;
gzip\_disable "MSIE \[1-6\].";

如果不恰当地设置pagespeed Domain（设置了不受自己控制的域名）就会变成这样……

![](https://easysvc.xyz/wp-content/uploads/pagespeed_capture_4-1024x576.png)

翻车现场4（不恰当的设置pagespeed Domain导致pagespeed重写url时写成了无法访问的url）  
我承认前面那几个woff是自己写相对路径写错了

还是老老实实地改回来吧。

折腾完这一波，发现Pagespeed Insights得分又降了回来，好气啊。同时发现Pagespeed Console还是那样子，算了算了（听说用了这玩意要常访问站点才能更快有效果？而且好像改一遍nginx设置就会自动清一遍缓存）。

## Stage Six

*   Nginx模块：[ngx\_pagespeed](https://developers.google.com/speed/pagespeed/module/?hl=zh-CN)
*   插件：Redis object cache、WP Super Cache
*   <head>修改：Preload、Preconnect（手动修改）
*   使用unix socket（修改配置文件）

根绝某些资料显示，在linux系统中把应用间的通信方式由tcp改为unix socket会提升性能，而Nginx与php、php(wordpress)与MySQL以及redis都支持unix socket通信，故尝试修改配置。

### Nginx

#注意与php配置前后一致
fastcgi\_pass   unix:/var/run/php-fpm/php74-fpm.sock;

### PHP

#注意与nginx配置前后一致
listen = /var/run/php-fpm/php74-fpm.sock

### WordPress

需要修改wp-config.php

/\*\* MySQL hostname \*/
define ( 'DB\_HOST', 'localhost:/var/lib/mysql/mysql.sock' );
/\*\* Set redis connection parameters \*/
/\*\* 用于redis插件 \*/
define( 'WP\_REDIS\_SCHEME', 'unix' );
define( 'WP\_REDIS\_PATH', '/var/run/redis/redis.sock' );

### MySQL

默认配置无需修改。

### Redis

unixsocket /var/run/redis/redis.sock
unixsocketperm 777

## 现阶段方案

因为不知道怎么回事的奇葩操作，原来CentOS的服务器重启后无法引导，数据也全部灭失。我就重新整了个博客（并从谷歌快照里恢复了多数以前的博文），但是我懒得再重新编译Brotli（主要是因为Cloudflare并不能接受源服务器Brotli压缩过的数据）和ngx\_pagespeed，就想着通过插件、nginx配置的调整来实现类似效果。

*   优化插件：W3 Total Cache、EWWW Image Optimizer
*   其他变动：直接使用Site Kit by Google，不再使用第三方Analytics及Adsense插件；替换Gravatar默认源为国内可访问的源
*   使用unix socket（修改配置文件）

WP Super Cache生成静态页面、配合nginx配置文件可实现无需运行php即可访问博客的功能的确不错，但是对于其他方面优化的效果不是很好，因此我这次尝试了功能更多的W3 Total Cache。这款插件可以生成页面缓存、数据库缓存、对象缓存，还可CSS/JS Minify等等（部分功能需要订阅），其中JS Minify和CSS Minify出了基础的内置优化功能外，还可调用Google Closure Compiler或YUI Compressor深度优化。支持各种形式的缓存存储方式（磁盘、Memcached、Redis等）。如有Memcached/Redis的话，推荐对象缓存指定由Memcached/Redis存储；而页面缓存除非内存够大，仅推荐由磁盘缓存。unix socket同样可用，需要在**每一项**缓存配置下方的高级功能内设置。但是需要注意的是，安装插件后还需要调整nginx配置文件（建议在General Settings内设置"Nginx server configuration file path"，并勾选"Verify rewrite rules"，方便更改设置后W3TC对nginx的配置提出针对性修改），否则可能会出现一堆优化内容404 not found或者服务器CPU吃满的问题，站点后台菜单-Performance-Install内有详细改进说明。

EWWW Image Optimizer则替代了Pagespeed的图片压缩功能，安装启用后上传的新图片都会自动优化（并且可在设置内调整是否生成WebP文件）。与Pagespeed相比，优点十分明显：nginx内指定的浏览器缓存策略能够轻松生效；静态页面生成、搜索引擎爬虫抓取的源代码内嵌图片uri不会夹杂着奇怪的后缀。对于插件安装前已经上传的老资源，则可以在插件内的bulk optimize手动优化。需要注意的是，这款插件依赖Imagick，而Imagick及其他推荐的可选项是否安装可以在站点后台-工具-站点健康内查看。

Site Kit by Google则是Google推出的可用于关联Google旗下Analytics、Search Console、Adsense、Optimize、Tags等产品的Wordpress插件，可以一次性替代掉数个插件，只需简单的关联操作即可完成之前复杂的功能配置。同时您还可以在博客后台查看Pagespeed分数（但是好像有bug）。

Gravatar在国内近年来一直无法访问，而Wordpress使用Gravatar则会大幅拖慢博客在国内的访问速度。百度很容易就能找到解决问题的办法，但是代码有点老旧，而且并不能开箱即用。因此我稍加修改做成了一款插件，使用的是iloli的源（此处表示感谢），代码如下。可以自行上传到服务器内使用。

<?php
/\*
 \* Plugin Name: WP Gravatar Customize
 \* Plugin URI: https://easysvc.xyz
 \* Description: make Gravatar of your website accessible to some regions
 \* Version: 0.1.0
 \* Author: YAMAMETO
 \* Author URI: https://easysvc.xyz
 \* License: GPL2
 \* \*/

/\*  Copyright 2023  YAMAMETO  (email : wl223600@hotmail.com)
 \*
 \*       This program is free software; you can redistribute it and/or modify
 \*       it under the terms of the GNU General Public License as published by
 \*       the Free Software Foundation; either version 2 of the License, or
 \*       (at your option) any later version.
 \*
 \*       This program is distributed in the hope that it will be useful,
 \*       but WITHOUT ANY WARRANTY; without even the implied warranty of
 \*       MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 \*       GNU General Public License for more details.
 \*
 \*       You should have received a copy of the GNU General Public License
 \*       along with this program; if not, write to the Free Software
 \*       Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 \*
 \*/



function replace\_avatar($avatar) {
            $avatar = str\_replace(array("www.gravatar.com","0.gravatar.com","1.gravatar.com","2.gravatar.com","secure.gravatar.com"),"gravatar.loli.net",$avatar);
    return $avatar;
}
add\_filter( 'get\_avatar', 'replace\_avatar', 10, 3 );

此外，php的`pm.max_children`等设置也需要调整，过小时会导致站点访问缓慢（具体可查看`/var/log`内的日志）。具体作用及设置这里就不多介绍了。

### 前文部分做法的纠正

根据GTmetrix的[建议](https://gtmetrix.com/preconnect-to-required-origins.html)，网站管理者应当仅对重要的第三方资源使用`preconnect`，建议最大同时使用的数量为2，且`preconnect`仅对第三方资源有效。而对于其他必要的第三方资源，可以使用`dns-prefetch`来加快页面加载速度，但是据称Chrome仅能同时处理3个`dns-prefetch`。

## 结束语

优化终究是有限度的，要么采取插件（或者模块）的形式，要么就升级硬件配置。前者影响代码结构，后者在同样动态生成页面时对TTFB（响应时间）影响更大。当代码优化到极限后，还想白嫖提升速度？不存在的。

此外，部分服务提供商的默认配置不是很合理，例如1G运存的机器默认只分配了256M不到的SWAP（说的就是搬瓦工），导致了mysql动辄重启、php运行效率低下（mysql和php的默认配置对低运存机器很不友好）。合理值个人认为在512M。为了提升SWAP的效率，大家也可以开启ZRAM（说白了就是高达50%压缩比率、存放在运存的SWAP）来获取相比SWAP更优化的速度，推荐占用15%~25%的RAM大小，过高则可能会导致异常行为。ZRAM还会牺牲少量CPU性能。更新当然可能不稳定的zswap和zcache我并没有使用。

因为自己是初学者，所以可能本文会有很多大佬觉得很naive的地方，原理不是很清楚，配置可能也有误或者显得多余，希望大佬在评论区里纠正交流一下。

最后吐槽个Cloudflare，我都对博客域名停用Add HTML的那个APP了，然而还在博客的<head>里乱拉屎（插用不到的JS）。

## 附：Pagespeed部分错误修正提示

### PageSpeed Serf fetch failure rate extremely high; only <num\_1> of <num\_2> recent fetches fully successful

官方Github中的[此issue](https://github.com/apache/incubator-pagespeed-ngx/issues/1562)提及了这个问题，如果您的站点启用了https的话，[这里](https://www.modpagespeed.com/doc/https_support#configuring_ssl_certificates)似乎是针对此问题的解决方案。

## 修订日志

20210517：采用了新方案  
20200617：增加unix socket配置  
20200606：增加优化SWAP/ZRAM的指示；优化了页面内部分提示  
20190930：试验性地增加优化JS引用图片的设置项，灵感源于[此博文](https://wzfou.com/ngx-pagespeed)，在此表示感谢  
20200126：修正pagespeed配置，增加附录

参考：

[博客园：archer-wong](https://www.cnblogs.com/redirect/p/10140267.html)