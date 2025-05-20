FROM python:3.12-slim

ADD . /

ENV workflow_result 'Failure'
ENV payload '{}'

CMD python notify.py ${workflow_result} ${payload}
