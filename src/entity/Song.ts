import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { SimpleSpotifySong } from "./SpotifySong";

export enum SongType {
  Spotify = 'spotify',
  YouTube = 'youtube',
}

@Entity()
export class Song {

  @PrimaryGeneratedColumn("increment")
  id: number

  @Column()
  title: string

  @Column()
  addedBy: string

  @Column()
  playlistId: string

  @Column()
  plays: number

  @Column()
  uid: string;

  @Column({
    type: 'simple-enum',
    enum: SongType,
    default: SongType.Spotify,
  })
  songType: SongType;

  // SpotifyId of YoutubeId
  @Column()
  platformId: string;

  // additional information about the song, youtube does not require that (yet)
  @Column({
    type: 'simple-json',
    nullable: true,
  })
  song: SimpleSpotifySong | undefined;

}