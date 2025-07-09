$(function () {
  var a = $(".visualSssf_left a");
  for (var i = 0; i < a.length; i++) {
    a[i].index = i;
    a[i].onclick = function () {
      for (var i = 0; i < a.length; i++) {
        a[i].className = "";
      }
      this.className = "active";
    };
  }

  var sfzcllH = $(".sfzcll_box").height();
  var sfzcllHtwo = sfzcllH - 2;
  $(".sfzcll_box").css("line-height", sfzcllH + "px");
  $(".sfzcll_smallBk>div").css("line-height", sfzcllHtwo + "px");

  //删除加载动画
  $("#load").fadeOut(1000);
  setTimeout(function () {
    $("#load").remove();
  }, 1100);
});
