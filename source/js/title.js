var OriginTitle = document.title;
var titleTime;
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        document.title = '💢(/≧▽≦/)你别走吖！';
        clearTimeout(titleTime);
    }
    else {
        document.title = '❤️ヾ(Ő∀Ő3)ノ你又回来啦！' + OriginTitle;
        titleTime = setTimeout(function () {
            document.title = OriginTitle;
        }, 2000);
    }
});