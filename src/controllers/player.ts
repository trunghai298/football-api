import { list, search, autoComplete } from '../services/player';

export class PlayerController {

  static list = async (req: any, res: any, next: any) => {
    try {
      const result = await list(req.query, req.ctx);
      res.json(result);
    } catch (e) {
      next(e);
    }
  };

  static search = async (req: any, res: any, next: any) => {
    try {
      const result = await search(req.query, req.ctx);
      res.json(result);
    } catch (e) {
      next(e);
    }
  };

  static autoComplete = async (req: any, res: any, next: any) => {
    try {
      const result = await autoComplete(req.query, req.ctx);
      res.json(result);
    } catch (e) {
      next(e);
    }
  };
}
