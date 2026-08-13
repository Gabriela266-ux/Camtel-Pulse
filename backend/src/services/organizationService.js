const db = require('../models');

class OrganizationService {
  async getTree() {
    const centres = await db.Centre.findAll({
      include: [{
        model: db.Da,
        as: 'das',
        include: [{
          model: db.Dsm,
          as: 'dsms',
          include: [{ model: db.Pos, as: 'pos_list' }]
        }]
      }]
    });
    return centres;
  }

  async getCenterSummary() {
    const centres = await db.Centre.findAll({
      include: [{ model: db.Da, as: 'das' }]
    });

    return centres.map((centre) => ({
      id: centre.id,
      nom_centre: centre.nom_centre,
      region: centre.region,
      totalMonthlyGoal: centre.das.reduce((sum, da) => sum + Number(da.objectif_mensuel || 0), 0),
      clientCount: centre.das.length,
      dsmCount: centre.das.reduce((sum, da) => sum + (da.dsms ? da.dsms.length : 0), 0),
      posCount: centre.das.reduce((sum, da) => {
        return sum + (da.dsms ? da.dsms.reduce((s, dsm) => s + (dsm.pos_list ? dsm.pos_list.length : 0), 0) : 0);
      }, 0)
    }));
  }
}

module.exports = new OrganizationService();