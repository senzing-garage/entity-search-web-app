class packageInfo {
    'name'                  = 'entity-search-webapp';
    'version'               = 'unknown';
    'angular'               = 'unknown';
    'material'              = 'unknown';
    'sdk-components-ng'     = 'unknown';
    'sdk-graph-components'  = 'unknown';
    'rest-api-client-ng'    = 'unknown';
    'd3'                    = 'unknown';
    'typescript'            = 'unknown';
    packagePath = '../../package.json';

    constructor(packagePath) {
        if(packagePath) {
            this.packagePath = packagePath;
        }
        this.readPackageJSON();
    }
    readPackageJSON() {
        try{
            let packageJSON = require(this.packagePath);
            if(packageJSON) {
                if(packageJSON.name) {    this.name     = packageJSON.name }
                if(packageJSON.version) { this.version  = packageJSON.version }
                if(packageJSON.dependencies) { 
                    this['angular']                 = packageJSON.dependencies['@angular/core'] ?                   packageJSON.dependencies['@angular/core'] :                 this['angular'];
                    this['material']                = packageJSON.dependencies['@angular/material'] ?               packageJSON.dependencies['@angular/material'] :             this['material'];
                    this['sdk-components-ng']       = packageJSON.dependencies['@senzing/sdk-components-ng'] ?      this.getVersionFromLocalTarPath( packageJSON.dependencies['@senzing/sdk-components-ng'], 'senzing-sdk-components-ng-')  :   this['sdk-components-ng'];
                    this['sdk-graph-components']    = packageJSON.dependencies['@senzing/sdk-graph-components'] ?   this.getVersionFromLocalTarPath( packageJSON.dependencies['@senzing/sdk-graph-components'], 'sdk-graph-components-')    :   this['sdk-graph-components'];
                    this['rest-api-client-ng']      = packageJSON.dependencies['@senzing/rest-api-client-ng'] ?     this.getVersionFromLocalTarPath( packageJSON.dependencies['@senzing/rest-api-client-ng'], 'rest-api-client-ng-')        :   this['rest-api-client-ng'];
                    this['d3']                      = packageJSON.dependencies['d3'] ?                              packageJSON.dependencies['d3'] :                            this['d3'];
                }
                if(packageJSON.devDependencies) {
                    this['typescript']              = packageJSON.devDependencies['typescript'] ?                   packageJSON.dependencies['typescript'] :                    this['typescript'];
                }
            } else {
                console.error('packageInfo.readPackageJSON() could not read json: '+ this.packagePath);
            }
        }catch(err){
            console.error('packageInfo.readPackageJSON() ERROR! '+ err);
        }
    }
    asJSON() {
        let retVal = {
            'name':                 this.name,
            'version':              this.version,
            'angular':              this.angular,
            'material':             this.material,
            'sdk-components-ng':    this['sdk-components-ng'],
            'sdk-graph-components': this['sdk-graph-components'],
            'rest-api-client-ng':   this['rest-api-client-ng'],
            'd3':                   this.d3,
            'typescript':           this.typescript
        };
        return retVal;
    }

    getVersionFromLocalTarPath(packagePath, packagePrefix ) {
        let retVal = packagePath;
        if (packagePath && packagePath.indexOf && packagePath.indexOf('file:') === 0) {
            const pathArr = packagePath.split('/');
            const fileName = pathArr.pop();
            if (fileName && fileName.indexOf && fileName.indexOf('.tgz') > -1) {
            let startAt = 0;
            if(packagePrefix && fileName.indexOf(packagePrefix) > -1) {
                startAt = fileName.indexOf(packagePrefix) + packagePrefix.length;
            }
            retVal = fileName.substring(startAt, fileName.indexOf('.tgz'));
            } else if (fileName) {
            retVal = fileName;
            }
        }
        return retVal;
    }
}

module.exports = new packageInfo();