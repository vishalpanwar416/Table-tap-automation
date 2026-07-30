class ConfigRepository {
  constructor(AppConfig) {
    this.AppConfig = AppConfig;
  }

  async get() {
    let config = await this.AppConfig.findOne();
    if (!config) config = await this.AppConfig.create({});
    return config;
  }

  async update(values) {
    const config = await this.get();
    Object.assign(config, values, { updatedAt: new Date() });
    return config.save();
  }
}

module.exports = ConfigRepository;
