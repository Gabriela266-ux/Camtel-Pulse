const { randomUUID } = require('crypto');
const db = require('../src/models');
const accountService = require('../src/services/accountService');

const ROLLBACK = new Error('ROLLBACK_FOREIGN_KEY_REGRESSION_TEST');

async function main() {
  let verified = false;
  const requestEmail = `access-request-${randomUUID()}@example.test`;
  try {
    // Exercise the exact public access-request payload.  The created account
    // is removed immediately after the assertion, so this leaves no test data.
    const requestedAccount = await accountService.requestAccount({
      name: 'Access request regression test',
      poste: 'Directeur',
      matricule: `REQ-${randomUUID()}`,
      email: requestEmail,
      telephone: '600000000'
    });
    if (!requestedAccount.role_id) {
      throw new Error('The access request was created without a role_id');
    }
    const requestUser = await db.Utilisateur.findByPk(requestedAccount.utilisateur_id);
    await db.sequelize.transaction(async (transaction) => {
      // Supprime d'abord la demande créée par requestAccount, qui référence
      // l'utilisateur, avant de retirer le compte de test.
      await db.DemandeAcces.destroy({ where: { utilisateur_id: requestUser.id }, transaction });
      await accountService.destroyUnreferencedUser(requestUser, transaction);
    });

    await db.sequelize.transaction(async(transaction) => {
      const role = await db.Role.findOne({ transaction });
      if (!role) throw new Error('Aucun rôle disponible pour le test de clé étrangère');

      const resolvedRoleId = await accountService.resolveRequestedRole({ poste: 'Animateur territorial' }, transaction);
      await accountService.validateAccountReferences({ role_id: resolvedRoleId }, transaction, { requireRole: true });

      const suffix = randomUUID();
      const user = await db.Utilisateur.create({
        role_id: role.id,
        matricule: `FK-${suffix}`,
        nom_complet: 'FK regression test',
        email: `fk-${suffix}@example.test`,
        mot_de_passe: 'not-used-by-test'
      }, { transaction });

      const snapshot = await db.TableSnapshot.create({
        entite_type: 'pos',
        entite_id: randomUUID(),
        periode: '2099-01',
        lignes: 1,
        payload: '[]',
        created_by: user.id
      }, { transaction });

      try {
        await accountService.validateAccountReferences({ da_id: randomUUID() }, transaction);
        throw new Error('Une référence parent inexistante aurait dû être refusée');
      } catch (error) {
        if (error.statusCode !== 400) throw error;
      }

      try {
        await accountService.destroyUnreferencedUser(user, transaction);
        throw new Error('La suppression d’un utilisateur référencé aurait dû être refusée');
      } catch (error) {
        if (error.statusCode !== 409 || !error.references?.some((ref) => ref.table === 'table_snapshot' && ref.column === 'created_by')) {
          throw error;
        }
      }

      const preserved = await db.TableSnapshot.findByPk(snapshot.id, { transaction });
      if (!preserved || preserved.created_by !== user.id) {
        throw new Error('Le snapshot référencé n’a pas été préservé');
      }
      verified = true;
      throw ROLLBACK;
    });
  } catch (error) {
    if (error !== ROLLBACK) throw error;
  } finally {
    await db.sequelize.close();
  }

  if (!verified) throw new Error('La protection contre la violation de clé étrangère n’a pas été vérifiée');
  console.log('Public access request resolves a valid role; referenced-account deletion is safely rejected and the snapshot is preserved.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
