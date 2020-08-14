const inMemoryConfig = require("./runtime.datastore");
const inMemoryConfigFromInputs = require('./runtime.datastore.config');

const configurations = new inMemoryConfig(inMemoryConfigFromInputs);

if(inMemoryConfigFromInputs.writeProxyConfigToFile) {
  configurations.writeProxyConfigToFile("../","proxy.conf.json");
}
