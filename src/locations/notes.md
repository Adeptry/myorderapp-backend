async webhookUpdate(
input: MoaLocationWebhookUpdateInput,
): Promise<MoaLocation | null> {
const merchant = (await this.merchantService.findOne({
where: { merchantSquareId: input.merchantSquareId },
}));

    const squareLocation = await this.squareService.retrieveLocation(
      input.locationSquareId,
      merchant,
    );

    if (squareLocation) {
      const moaLocation = await this.findOne({
        where: { locationSquareId: squareLocation.id },
      });

      if (!moaLocation) {
        return null;
      }

      this.assignSquareLocationToMoaLocation(squareLocation, moaLocation);

      return this.repository.save(moaLocation);
    } else {
      return null;
    }

}
