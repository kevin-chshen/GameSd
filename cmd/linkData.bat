REM 将策划导出的文件连接到服务端目录
REM 连接config/data目录
junction.exe ../config/data ../../../Data/Server/data
REM 连接export文件
junction.exe ../app/constant/export ../../../Data/Server/constant

pause
