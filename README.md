# GP3120-Label-printer
chrome plug-in of GP3120 Label printer

佳博GP系列标签打印机chrome插件程序
==================================

请勿安装打印机自带驱动，如果已经安装自带驱动，请手动卸载驱动，因为打印机自带驱动，我们自己开发的插件程序没有权限访问，请用Zadig程序安装开源驱动程序libusbK，详细安装方法见doc中文档

插件工作原理
    调用开源驱动---->通过开源驱动发送命令给打印机---->打印机接收命令后进行打印
    
插件代码文件
1.	index.js

插件调用打印入口
var onDeviceFound = function(devices) 

插件调用方法
打印机命令文档请查看打印机提供光盘中的“条码机中文编程手册.pdf”文档，开发过程请配合文档开发，本插件已对文档中常用命令进行封装，命令封装的方法名和参数名及参数个数均与文档中对应。

1.合并多个命令发送给打印机：

	  var data1 = buildPackage(
							  CmdSIZE(30,20),
							  CmdGAP(3,0),
							  
							  CmdREFERENCE(0,0),
							  CmdSPEED("4.0"),
							  CmdDENSITY(8),
							  CmdSET_PEEL("OFF"),
							  CmdSET_CUTTER("OFF"),
							  CmdSET_PARTIAL_CUTTER("OFF"),
							  CmdSET_TEAR("ON"),
							  CmdDIRECTION(0),
							  CmdSHIFT(0),
							  CmdOFFSET(0),
							  
							  CmdCLS(),
							  CmdBITMAP(96,0,img.width, img.height,1,img),
						  
							  //CmdBARCODE(16,19,"128M",110,1,0,3,9,123123123),
							  //CmdBARCODE(16,19,"128M",110,1,0,3,9,"666666"),
							  CmdPRINT(1,1)
							  );
2.调用方法
将需要发给打印机的命令添加到buildpackage的参数列表中

常用命令封装
命令命名规则：Cmd+开发文档中的命令名（请参考开发文档）。

1.打印位图命令
var CmdBITMAP = function(X, Y, WidthSrc, Height, mode, img) 
如下对应开发文档中参数使用方法

2.标签纸大小设置命令
var CmdSIZE = function(Width, Height) 
 
3.其他已封装命令，命令用法请参考开发文档
        var CmdGAP = function(m, n)
        
        var CmdREFERENCE = function(x, y)
        
        var CmdDENSITY = function(n)
        
        var CmdSET_PEEL = function(OnOrOff)
        
        var CmdSET_PARTIAL_CUTTER = function(OnOrOff)
        
        var CmdSET_CUTTER = function(OnOrOff)
        
        var CmdSET_TEAR = function(OnOrOff)
        
        var CmdDIRECTION = function(n)
        
        var CmdSHIFT = function(n)
        
        var CmdOFFSET = function(n)
        
        var CmdCLS = function()
        
        var CmdQRCODE_Mask = function(X, Y, ECC, Width, mode, rotation, model, mask, Data)
        
        var CmdBARCODE = function(X, Y, Type, height, human, rotation, narrow, wide, code)
        
        var CmdPRINT = function(m,n)

4.新命令封装方法
 请参考其他命令封装方法，如封装SIZE命令，将需要的字符串填充到dataStr字符串中即可。
 
