import { Request, Response } from "express";
import { getRepository } from "typeorm";

import * as Yup from "yup";

import groups_view from "../views/groups_view";

import Group from "../models/Group";
import Image from "../models/Image";

interface IGroup {
  name: string;
  description: string;
  avatar: string;
  background: string;
}

interface IGroupUpdate {
  name?: string;
  description?: string;
  avatar?: string;
  background?: string;
}

export default {
  // OKAY
  async index(request: Request, response: Response) {
    const groupRepository = getRepository(Group);

    const groups = await groupRepository.find();

    return response.status(200).send(groups_view.renderMany(groups));
  },
  // OKAY
  async show(request: Request, response: Response) {
    const { id } = request.params;

    const groupRepository = getRepository(Group);

    const group = await groupRepository.findOne({ where: { id } });

    if (!group)
      return response.status(400).send({ message: "group not found!" });

    return response.status(200).send(groups_view.render(group))
  },
  // OKAY
  async create(request: Request, response: Response) {
    const { name, description } = request.body;

    const images = request.files as Express.Multer.File[];
    // req.files['myImage'][0].filename,

    const avatar = images[0].filename;
    const background = images[1].filename;

    const imageRepository = getRepository(Image);

    const groupRepository = getRepository(Group);

    const groupExist = await groupRepository.findOne({ where: { name } });

    if (groupExist) {
      return response
        .status(400)
        .send({ message: "group already registered!" });
    }

    const data: IGroup = {
      name,
      description,
      avatar,
      background,
    };

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      description: Yup.string().required(),
      avatar: Yup.string().required(),
      background: Yup.string().required(),
    });

    try {
      await schema.validate(data, { abortEarly: false, strict: true });
    } catch (error) {
      return response.status(400).send({ message: error.erros });
    }

    const group = groupRepository.create(data);

    await groupRepository.save(group);

    const imagesGroup = imageRepository.create([
      {
        group_id: group.id,
        path: images[0].path,
      },
      {
        group_id: group.id,
        path: images[1].path,
      },
    ]);
    await imageRepository.save(imagesGroup);

    return response.status(200).json(group);
  },
  // OKAY
  async update(request: Request, response: Response) {
    const { id } = request.params;

    const { name, description } = request.body;

    const images = request.files as Express.Multer.File[];

    const avatar = images[0].filename;
    const background = images[1].filename;

    const imageRepository = getRepository(Image);

    const currentImages = await imageRepository.find({
      where: { group_id: { id } },
    });

    if (!currentImages)
      return response.status(400).send({ message: "images not found!" });

    const groupRepository = getRepository(Group);

    const group = await groupRepository.findOne({ where: { id } });

    if (!group)
      return response.status(400).send({ message: "ground not found!" });

    const data: IGroupUpdate = {
      name,
      description,
      avatar,
      background,
    };

    const schema = Yup.object().shape({
      nam: Yup.string(),
      description: Yup.string(),
      avatar: Yup.string(),
      background: Yup.string(),
    });

    try {
      await schema.validate(data, { abortEarly: false, strict: true });
    } catch (error) {
      return response.status(400).send({ message: error.erros });
    }

    const groupUpdated = groupRepository.merge(group, data);

    await groupRepository.save(groupUpdated);

    // const imgesUpdate = imageRepository.merge(currentImages, [
    //   {
    //     group_id: groupUpdated.id,
    //     path: images[0].filename 
    //   },
    //   {
    //     group_id: groupUpdated.id,
    //     path: images[1].filename 
    //   }
    // ])

    return response.status(200).json(groupUpdated);
  },
  // OKAY
  async delete(request: Request, response: Response) {
    const { id } = request.params;

    const groupRepository = getRepository(Group);

    const groupExist = await groupRepository.findOne({ where: { id } });

    if (!groupExist) {
      return response.status(400).send({ message: "group not found!" });
    }

    await groupRepository.delete(id);

    return response.status(200).send();
  },
};