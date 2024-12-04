#!/bin/bash
set -e

#if [ "$1" = 'create' ]; then
#    echo "$@"
#fi

e2eDir=/opt/senzing/e2e;
today=`date '+%Y_%m_%d__%H_%M'`;
#repoLocation="$e2eDir/$today"
repoLocation="$e2eDir/temp";

if [[ ! -e $e2eDir ]]; then
    mkdir -p $e2eDir
elif [[ ! -d $e2eDir ]]; then
    echo "$e2eDir already exists but is not a directory" 1>&2
fi

cp -R /app/senzing/e2e/data /opt/senzing/e2e
#exec ls -l /opt/senzing/e2e/data

echo "contents of /opt/senzing:"
echo ""
ls -l /opt/senzing
echo ""

# remove directory if it already exists
if [[ -e $repoLocation ]]; then
  rm -fR $repoLocation
fi

if [[ ! -e $repoLocation ]]; then
  java -jar /app/senzing-api-server.jar --repomgr -createRepo ${repoLocation}
  java -jar /app/senzing-api-server.jar --repomgr -repo ${repoLocation} -configSources owners companies
  java -jar /app/senzing-api-server.jar --repomgr -repo ${repoLocation} -dataSource companies -loadFile /opt/senzing/e2e/suites/001/data/relTestCompanies.csv
  java -jar /app/senzing-api-server.jar --repomgr -repo ${repoLocation} -dataSource owners -loadFile /opt/senzing/e2e/suites/001/data/relTestOwners.csv
elif [[ -e $repoLocation ]]; then
  echo ""
  echo "DATE REPO NOT EMPTY!"
  ls -l ${repoLocation}
  echo ""
fi

echo "------------------------------------"
echo "starting api server..\"$@\""
echo ""
exec java -jar /app/senzing-api-server.jar $@
