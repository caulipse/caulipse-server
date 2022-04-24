import bcrypt from 'bcrypt';
import { getRepository } from 'typeorm';
import User, { UserRoleEnum } from '../../entity/UserEntity';

interface SaveUserDTO {
  id: string;
  email: string;
  password: string;
  token: string;
}

export const saveUser = async ({ id, email, password, token }: SaveUserDTO) => {
  return await getRepository(User)
    .createQueryBuilder()
    .insert()
    .values({
      id,
      email,
      password: bcrypt.hashSync(password, 10),
      isLogout: false,
      role: UserRoleEnum.GUEST,
      token,
    })
    .execute();
};

export const changeUserRoleById = async (id: string) => {
  return await getRepository(User)
    .createQueryBuilder()
    .update()
    .set({
      role: UserRoleEnum.USER,
    })
    .where('ID = :id', { id })
    .andWhere(`ROLE = 'GUEST'`)
    .execute();
};

export const findUserByEmail = async (email: string) => {
  return await getRepository(User)
    .createQueryBuilder()
    .select()
    .where('EMAIL = :email', { email })
    .getOne();
};

export const findUserById = async (id: string) => {
  return await getRepository(User)
    .createQueryBuilder('user')
    .where('user.ID = :id', { id })
    .getOne();
};

export const findUserByToken = async (token: string) => {
  return await getRepository(User)
    .createQueryBuilder()
    .select()
    .where('TOKEN = :token', { token })
    .getOne();
};
interface UpdateUserDTO {
  email: string;
  password: string;
  isLogout: boolean;
  token: string;
  role: UserRoleEnum;
}

export const updateUserById = async (id: string, data: UpdateUserDTO) => {
  const { email, password, isLogout, token, role } = data;
  return await getRepository(User)
    .createQueryBuilder()
    .update()
    .set({ email, password, isLogout, token, role })
    .where('ID = :id', { id })
    .execute();
};

export const updatePasswordById = async (id: string, newPassword: string) => {
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  return await getRepository(User)
    .createQueryBuilder()
    .update()
    .set({ password: hashedPassword })
    .where('ID = :id', { id })
    .execute();
};

export const updateTokenById = async (id: string, token: string) => {
  return await getRepository(User)
    .createQueryBuilder()
    .update()
    .set({ token })
    .where('ID = :id', { id })
    .execute();
};

export const deleteUserById = async (id: string) => {
  return await getRepository(User)
    .createQueryBuilder()
    .delete()
    .where('ID = :id', { id })
    .execute();
};

const _setLogoutStatusById = (logoutStatus: boolean) => async (id: string) => {
  return await getRepository(User)
    .createQueryBuilder()
    .update()
    .set({ isLogout: logoutStatus })
    .where('ID = :id', { id })
    .execute();
};

export const logoutUserById = _setLogoutStatusById(true);

export const loginUserById = _setLogoutStatusById(false);
