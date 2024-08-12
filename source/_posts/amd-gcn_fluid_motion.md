---
title: AMD GCN架构显卡补帧的实现
description: AMD YES! 48/60帧的大片看着真舒服。啥时候能把ROCM在Windows上的支持也做好就更棒了。
tags:
  - AMD
id: '49'
categories:
  - - 折腾笔记
date: 2019-02-02 22:49:00
---
# 写在前面

~~RDNA1/2/3目前尚无有效的利用AFM补帧的方法，下述方法仅适用于GCN架构的显卡。~~
新版本的Bluesky Frame Rate Converter已支持RDNA插帧，效果虽不及GCN架构显卡，但已处于可用水平。

# 正文

AMD的补帧算是A卡的“黑科技”之一，不过AMD对此宣传一向是APU配合特定软件可用，其实是支持GCN 1.1及更新架构的显卡。然而，日本某大神直接做到了GCN架构通杀，详细教程如下。

提示:笔记本显卡同样适用本教程，只是需要在AMD Radeon Settings内强制播放器使用独显播放。

## 所需条件

> 系统: Windows 8.1或更新的系统
>
> 显卡:AMD GCN架构的显卡（可在AMD官网查看有关显卡架构的详细信息；注意不支持RDNA及更新的显卡）
>
> 软件:AMD Radeon Settings Crimson或更新的版本的设置中心
>
> [Bluesky Frame Rate Converter](http://bluesky23.yukishigure.com/en/BlueskyFRC.html)
>
> PotPlayer或者Media Player Classic

## 操作步骤

1、打开AMD Radeon Settings，点击“视频”选项卡，启用其中的“自定义”设置。自定义清晰度、对比度、亮度按照自己要求调整。“AMD Fluid Motion Video”必须开启（如果找不到该选项，请检查显卡类型是否符合要求，如果确定符合，请先执行第二步）。

![](/images/Radeon.png)

2、打开Bluesky Frame Rate Converter，进行配置。如果“Driver Setting”下的按钮不是“Initialize AFM Support”，请先点击按钮。系统会提示重启，推荐重启，返回执行第一步。“AFM Mode”不推荐选择“Auto”，笔者R7 M370选择Auto时无法进行补帧，选择“Mode 1”和“Mode 2”均可，前者比较保守，后者相对激进，但两种方式对不同视频有着不同的效果，详情可自行测试。“Rate Convertion”下的“24p”和“30p”均需选中。如果使用过程中发现符合条件的视频仍然不能补帧，请尝试勾选“Skip rate check ……”选项。“Performance”下的两个选项需要开启，其中第二个选项可提升补帧性能，对于笔记本上性能较弱的显卡进行高分辨率视频补帧时尤为有用。设置完成后保存关闭即可。

![](/images/BFC.png)

![](/images/2018/02/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE38.png)

3、这里以PotPlayer为例，说明启用补帧的过程。

（1）打开PotPlayer，点击菜单内的“选项”；

（2）找到滤镜——全局滤镜优先权，添加系统滤镜，选择“Bluesky Frame Rate Converter”并确定；

（3）更改“Bluesky Frame Rate Converter”的优先顺序为“强制使用”。

![](/images/PotPlayer.png)

![](/images/2018/02/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE41.png)

## 注意事项

* 对于笔记本平台，请在AMD Radeon Settings内的“系统”选项卡中找到“可切换显卡”子选项，在配置中寻找播放器进程名称，确保其已启用“高性能”配置。如果找不到，可以手动添加。由于笔记本平台的AMD设置对大多数的视频播放应用以及浏览器做出了显卡使用限制，因此用户要实现浏览器在线视频补帧可能有点困难。笔者使用的Opera、Edge、IE都被限定只能使用核显且无法更改，如果大家发现可以调用独显的浏览器，可以在评论区说明。
* Bluesky Frame Rate Converter要求使用EVR作为渲染器（默认情况下即为该渲染器），使用其他渲染器可能会导致补帧失败。
* 如果GPU负载过高，可能会出现音/视频不同步现象，此时请确定“Enable Zero-Copy Mode”已经开启，并重新打开播放器。如果还没有效果，可以使用软件解码，或者降低片源分辨率（可尝试缩小播放窗口）/码率。
* 相比于SVP（比较通用的一种补帧，会大量消耗CPU资源），AMD的补帧比较保守，有着更低的出错率。但对于变化幅度较大的帧，可能还会出现一些问题。有同学反映观看部分影片时会产生演员动作反物理规律的观感。
* 此项技术对视频的码率（清晰度）有一定要求，较低码率的视频补帧后可能会看起来比较模糊。
* 25帧视频无法进行补帧。

最后，祝大家观“奶”愉快～
