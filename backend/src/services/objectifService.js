const db = require('../models');

class ObjectifService {
  async listByType(type, parentId = null) {
    if (type === 'centre') {
      return db.Centre.findAll();
    }

    if (type === 'da') {
      return parentId
        ? db.Da.findAll({ where: { centre_id: parentId } })
        : db.Da.findAll();
    }

    if (type === 'dsm') {
      return parentId
        ? db.Dsm.findAll({ where: { da_id: parentId } })
        : db.Dsm.findAll();
    }

    if (type === 'pos') {
      return parentId
        ? db.Pos.findAll({ where: { dsm_id: parentId } })
        : db.Pos.findAll();
    }

    return [];
  }

  // Écrit l'objectif au bon endroit selon le niveau :
  // - DA : colonne objectif_mensuel directement sur la table da (valable en continu, pas de notion de mois)
  // - DSM / POS : ligne mensuelle dans objectif_mensuel (da_id/dsm_id/pos_id + annee + mois),
  //   créée si elle n'existe pas encore pour le mois demandé (mois courant par défaut).
  // NB : le cahier des charges réserve normalement la modification technique à l'Admin (RB-04),
  // mais l'encadreur a validé que Chef opérationnel et Opérationnel peuvent modifier l'objectif
  // (voir tableau des rôles Ressources.md) — c'est ce que ce service applique.
  async update(type, id, payload) {
    const montant = Number(payload.objectif_mensuel ?? 0);
    const now = new Date();
    const annee = Number(payload.annee) || now.getFullYear();
    const mois = Number(payload.mois) || now.getMonth() + 1;

    if (type === 'da') {
      const da = await db.Da.findByPk(id);
      if (!da) throw new Error('Client (DA) introuvable');
      await da.update({ objectif_mensuel: montant });
      return da;
    }

    if (type === 'dsm' || type === 'pos') {
      const where = type === 'dsm' ? { dsm_id: id, annee, mois } : { pos_id: id, annee, mois };
      let objectif = await db.ObjectifMensuel.findOne({ where });

      if (objectif) {
        await objectif.update({ montant_objectif: montant });
      } else {
        objectif = await db.ObjectifMensuel.create({ ...where, montant_objectif: montant });
      }

      return objectif;
    }

    throw new Error('Type d\'entité introuvable (attendu : da, dsm ou pos)');
  }
}

module.exports = new ObjectifService();
