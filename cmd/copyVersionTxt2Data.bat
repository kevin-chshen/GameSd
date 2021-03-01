for /f "tokens=1,2 delims='" %%a in (../../../Cdn/Publish/version.txt) do (
set str={ "version": "%%a" }
)
(echo %str%) > ../config/data/ClientVersion.json
echo %str%