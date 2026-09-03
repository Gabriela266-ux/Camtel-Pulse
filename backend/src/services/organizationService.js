const db = require('../models');

class OrganizationService {
    async getTree(centerId = null) {
        const centres = await db.Centre.findAll({
            where: centerId ? { id: centerId } : {},
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

    // Adapte l'arbre Sequelize (Centre/Da/Dsm/Pos, nom_centre) vers le shape
    // attendu par le frontend (CentreHierarchy: id/nom/da/dsm/pos).
    async getFrontendHierarchy(centerId) {
        if (!centerId) return null;
        const centres = await this.getTree(centerId);
        const centre = centres[0];
        if (!centre) return null;

        return {
            id: centre.id,
            nom: centre.code_centre || centre.nom_centre,
            da: (centre.das || []).map((da) => ({
                id: da.id,
                nom: da.nom,
                code: da.code,
                region: da.region,
                numero_sim: da.numero_sim,
                code_zone: da.code_zone,
                nom_reseau: da.nom_reseau,
                dsm: (da.dsms || []).map((dsm) => ({
                    id: dsm.id,
                    nom: dsm.nom,
                    numero_telephone: dsm.numero_telephone,
                    code_dsm: dsm.code_dsm,
                    code_zone: dsm.code_zone,
                    nom_reseau: dsm.nom_reseau,
                    pos: (Array.isArray(dsm.pos_list) ? dsm.pos_list : []).map((p) => ({
                        id: p.id,
                        nom: p.nom,
                        numero_telephone: p.numero_telephone,
                        code_pos: p.code_pos,
                        code_dsm: p.code_dsm,
                        code_zone: p.code_zone,
                        nom_reseau: p.nom_reseau,
                    })),
                })),
            })),
        };
    }

    async getCenterSummary(centerId = null) {
        const centres = await db.Centre.findAll({
            where: centerId ? { id: centerId } : {},
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
