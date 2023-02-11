import { Entity, Column, Index } from "typeorm";
import Model from "./model.entity";

export enum RoleEnumType {
  USER = "user",
  ADMIN = "admin",
}

@Entity("employeeinfo")
export class User extends Model {
  @Column()
  name: string;

  @Index("email_index")
  @Column({
    unique: true,
  })
  email: string;

  @Column()
  password: string;

  @Column({
    type: "enum",
    enum: RoleEnumType,
    default: RoleEnumType.USER,
  })
  role: RoleEnumType.USER;

  @Column({
    default: "default.png",
  })
  photo: string;

  @Column({
    default: false,
  })
  verified: boolean;

  toJSON() {
    return { ...this, password: undefined, verified: undefined };
  }
}
