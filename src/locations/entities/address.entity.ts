import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import { EntityHelper } from 'src/utils/entity-helper';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('address')
export class Address extends EntityHelper {
  /* Base entity */

  @ApiProperty({ required: false })
  @PrimaryColumn('varchar')
  @Exclude({ toPlainOnly: true })
  id?: string;

  @BeforeInsert()
  setId() {
    this.id = nanoid();
  }

  @CreateDateColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  createDate?: Date;

  @UpdateDateColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  updateDate?: Date;

  @DeleteDateColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  deleteDate?: Date;

  @VersionColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  version?: number;

  /* Address entity */

  @ApiProperty({
    type: String,
    required: false,
    description: 'The first line of the address.',
  })
  @Column({ type: 'varchar', nullable: true })
  addressLine1?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description: 'The second line of the address, if any.',
  })
  @Column({ type: 'varchar', nullable: true })
  addressLine2?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description: 'The third line of the address, if any.',
  })
  @Column({ type: 'varchar', nullable: true })
  addressLine3?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description: 'The city or town of the address.',
  })
  @Column({ type: 'varchar', nullable: true })
  locality?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description: "A civil region within the address's `locality`, if any.",
  })
  @Column({ type: 'varchar', nullable: true })
  sublocality?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description: "A civil region within the address's `sublocality`, if any.",
  })
  @Column({ type: 'varchar', nullable: true })
  sublocality2?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description: "A civil region within the address's `sublocality_2`, if any.",
  })
  @Column({ type: 'varchar', nullable: true })
  sublocality3?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description:
      "A civil entity within the address's country. In the US, this is the state.",
  })
  @Column({ type: 'varchar', nullable: true })
  administrativeDistrictLevel1?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description:
      "A civil entity within the address's `administrative_district_level_1`. In the US, this is the county.",
  })
  @Column({ type: 'varchar', nullable: true })
  administrativeDistrictLevel2?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description:
      "A civil entity within the address's `administrative_district_level_2`, if any.",
  })
  @Column({ type: 'varchar', nullable: true })
  administrativeDistrictLevel3?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description: "The address's postal code.",
  })
  @Column({ type: 'varchar', nullable: true })
  postalCode?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description:
      'Indicates the country associated with another entity, such as a business. Values are in ISO 3166-1-alpha-2 format.',
  })
  @Column({ type: 'varchar', nullable: false })
  country?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description: "Optional first name when it's representing recipient.",
  })
  @Column({ type: 'varchar', nullable: true })
  firstName?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description: "Optional last name when it's representing recipient.",
  })
  @Column({ type: 'varchar', nullable: true })
  lastName?: string | null;
}
