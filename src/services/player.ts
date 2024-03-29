import { isNaN, map, isNull } from 'lodash';
import { getModels } from '../models/db.tables';
import { MySQLClient, Op } from '../clients/mysql';
import { BadRequestError } from '../utils/errors';

const { RawPlayerHistoryPerGame, TeamsTransfermarkt } = getModels(MySQLClient);

export const list = async (params: any, ctx: any) => {
  const limit = parseInt(params.limit, 10) || 25;
  const offset = parseInt(params.offset, 10) || 0;
  const query = params.q;

  const { sortBy, direction, positions, seasonName: seasonNameStr, tournamentId, teamId, positionDetail } = params;
  let where: any = {};

  const seasonName = parseInt(seasonNameStr, 10)

  if (!seasonName || isNaN(seasonName)) {
    throw new BadRequestError({ message: 'SeasonName is mandatory', field: 'seasonName' })
  }

  where[MySQLClient.Op.and] = [{
    seasonName: {
      [MySQLClient.Op.like]: `${seasonName}%`
    },
    tournamentId: {
      [Op.notIn]: [12, 30, 683, 684, 685, 686, 123, 94]
    }
  }]

  if (tournamentId) {
    where[MySQLClient.Op.and].push({
      tournamentId: parseInt(tournamentId, 10)
    })
  }

  if (teamId) {
    where[MySQLClient.Op.and].push({
      teamId: parseInt(teamId, 10)
    })
  }

  if (query) {
    where[MySQLClient.Op.and].push({
      name: {
        [Op.like]: `%${query}%`
      }
    })
  }

  if (positions && positions.length) {
    where[MySQLClient.Op.and].push({
      [MySQLClient.Op.or]: map(positions, position => ({
        playedPositions: {
          [MySQLClient.Op.like]: `%${position}%`
        }
      }))
    })
  }

  const players = await RawPlayerHistoryPerGame.findAndCountAll({
    where,
    limit,
    raw: true,
    offset,
    order: sortBy && direction ? [[sortBy, direction]] : [['name', 'asc']],
  });

  return players;
};

export const search = async (params: any, ctx: any) => {
  const { seasonNameStr, playerName, playerId } = params;
  let seasonName = parseInt(seasonNameStr, 10);
  if (!seasonNameStr) seasonName = 2018;

  const player = await MySQLClient.query(`SELECT * FROM players_transfermarkt WHERE playerId = ${playerId}`, { type: MySQLClient.QueryTypes.SELECT });
  const teamId = await MySQLClient.query(`SELECT transfermarktTeamId, whoscoredTeamId from teams_transfermarkt where name = '${player[0].teamName}'`, { type: MySQLClient.QueryTypes.SELECT });
  player[0].teamId = teamId.length > 0 ? teamId[0].transfermarktTeamId : null;
  player[0].whoscoredTeamId = teamId.length > 0 ? teamId[0].whoscoredTeamId : null;
  const tournamentId = await MySQLClient.query(`SELECT tournamentName, tournamentRegionName, weight FROM raw_players_history WHERE teamId = ${player[0].whoscoredTeamId} LIMIT 1`, { type: MySQLClient.QueryTypes.SELECT });
  player[0].tournamentName = tournamentId.length > 0 ? tournamentId[0].tournamentName : null;
  player[0].tournamentRegionName = tournamentId.length > 0 ? tournamentId[0].tournamentRegionName : null;
  player[0].weight = tournamentId.length > 0 ? tournamentId[0].weight : null;

  return player[0];
}

export const autoComplete = async (params: any, ctx: any) => {
  const { q } = params;

  const players = await MySQLClient.query(`SELECT distinct name, playerId, image FROM players_transfermarkt where name like '%${q}%' limit 15`, { type: MySQLClient.QueryTypes.SELECT });
  return players;
}