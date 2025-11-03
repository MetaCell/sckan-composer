FROM python:3.12-slim

ADD . /

ENV workflow_result='Failure'
ENV payload='{}'
ENV sender_email=''

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "notify.py"]
