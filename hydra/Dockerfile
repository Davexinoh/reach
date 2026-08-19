FROM ghcr.io/hydra-db/hydradb:latest

USER root
COPY start.sh /usr/local/bin/reach-hydra.sh
RUN chmod 755 /usr/local/bin/reach-hydra.sh \
  && mkdir -p /data/store /data/cache \
  && chown -R 10001:10001 /data

# Root so a Railway volume at /data is writable on first boot.
USER root
EXPOSE 7687 8443 9090
ENTRYPOINT ["/usr/local/bin/reach-hydra.sh"]
