
@echo “========install_wpbz_part.tar.gz 开始打包==================” 

call copyVersionTxt2Data.bat

if exist install_wpbz_part.tar.gz ( del /f install_wpbz_part.tar.gz )

cd ..
.\tools\7z\7z.exe a -ttar install_wpbz_part.tar ./app ./config ./sh ./sql ./app.js ./config.json ./jsconfig.json ./package.json ./pomelo.sh ./context.json -x!config\chshen -x!config\cyq -x!config\jzy -x!config\ljs -x!config\zml ./logs ./chatlog -x!logs/*.log -x!logs/*.log.* -x!chatlog/*.log
.\tools\7z\7z.exe a -tgzip install_wpbz_part.tar.gz install_wpbz_part.tar

del /f install_wpbz_part.tar

@echo “========install_wpbz_part.tar.gz 完成打包==================” 
pause