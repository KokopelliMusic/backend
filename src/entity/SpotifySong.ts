import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class SpotifySong {

  @PrimaryGeneratedColumn("increment")
  id: number

  @Column()
  title: string

  @Column()
  artist: string

  @Column()
  cover: string

  @Column()
  spotifyId: string

  @Column()
  length: number

  @Column()
  addedBy: string

  @Column()
  playlistId: string

  @Column()
  plays: number

  @Column()
  uid: string;

}