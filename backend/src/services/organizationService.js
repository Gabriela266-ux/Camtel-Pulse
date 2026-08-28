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

    // Adapte l'arbre Sequelize (Centre/Da/Dsm/Pos, nom_centre) vers le shape
    // attendu par le frontend (CentreHierarchy: id/nom/da/dsm/pos).
    async getFrontendHierarchy(centerId) {
        const centres = await this.getTree();
        const centre = centerId ? centres.find((c) => c.id === centerId) : centres[0];
        if (!centre) return null;

        return {
            id: centre.id,
            nom: centre.nom_centre === 'Centre 1 CDPSM' ? 'CPDSM 1' : centre.nom_centre,
            da: (centre.das || []).map((da) => ({
                id: da.id,
                nom: da.nom,
                region: da.region,
                numero_sim: da.numero_sim,
                dsm: (da.dsms || []).map((dsm) => ({
                    id: dsm.id,
                    nom: dsm.nom,
                    pos: (Array.isArray(dsm.pos_list) ? dsm.pos_list : []).map((p) => ({ id: p.id, nom: p.nom })),
                })),
            })),
        };
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