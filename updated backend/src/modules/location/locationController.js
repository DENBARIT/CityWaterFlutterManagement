import * as locationService from './locationService.js';

export const getSubCities = async (_req, res) => {
  try {
    const subCities = await locationService.getSubCities();
    return res.status(200).json({ success: true, data: subCities });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sub cities',
      error: error.message,
    });
  }
};

export const getWoredas = async (req, res) => {
  try {
    const { subCityId } = req.query;
    const woredas = await locationService.getWoredas(subCityId);
    return res.status(200).json({ success: true, data: woredas });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch woredas',
      error: error.message,
    });
  }
};
