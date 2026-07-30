class ConfigurationService {
  constructor(ConfigModel) {
    this.ConfigModel = ConfigModel;
  }

  async get() {
    let config = await this.ConfigModel.findOne();
    if (!config) config = await this.ConfigModel.create({});
    return config;
  }

  async update(values) {
    const config = await this.ConfigModel.findOne();
    if (!config) return this.ConfigModel.create(values);

    Object.assign(config, values, { updatedAt: new Date() });
    return config.save();
  }
}

module.exports = ConfigurationService;
