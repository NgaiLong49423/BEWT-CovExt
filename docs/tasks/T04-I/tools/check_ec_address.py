"""Read pinned ExpressCart Git blobs to anchor EC-GAP-003 review; no runtime calls."""
import hashlib
import json
import subprocess
import sys

PIN='b31302f4e99c3293bd742c6d076a721e168118b0'
TREE='d98ab97ab9ea1b007104f485e36098fdd2c16b61'
SPECS={
  'routes/customer.js':['router.post(\'/customer/update\'','req.session.customerAddress1 = customerObj.address1','router.post(\'/customer/login_action\'','req.session.customerAddress1 = customer.address1'],
  'routes/order.js':['router.get(\'/admin/order/create\', restrict','router.post(\'/admin/order/create\', async','orderAddr1: sanitize(req.body.address1 || req.session.customerAddress1)','sendEmail(req.session.paymentEmailAddr'],
  'lib/payments/instore.js':['router.post(\'/checkout_action\'','orderAddr1: req.session.customerAddress1','db.orders.insertOne(orderDoc)','sendEmail(req.session.paymentEmailAddr'],
  'app.js':['app.use(`/${gateway}`, require(`./lib/payments/${gateway}`))'],
  'public/javascripts/common.js':["$('#checkoutInstore')", "url: '/instore/checkout_action'"],
  'public/javascripts/expressCart.js':["$('#customerSave')", "url: '/customer/update'"],
}

def main(root):
    def git(*args): return subprocess.check_output(['git','-C',root,*args])
    if git('rev-parse',PIN+'^{tree}').decode().strip()!=TREE: raise ValueError('Unexpected app source tree')
    files=[]
    for path,needles in SPECS.items():
        raw=git('show',PIN+':'+path)
        lines=raw.decode('utf-8').splitlines()
        anchors=[]
        for needle in needles:
            matches=[i for i,line in enumerate(lines,1) if needle in line]
            if not matches: raise ValueError(f'Missing source anchor in {path}: {needle!r}')
            anchors.append({'anchor':needle,'lines':matches})
        files.append({'path':path,'gitBlob':git('rev-parse',PIN+':'+path).decode().strip(),
                      'sha256':hashlib.sha256(raw).hexdigest(),'anchors':anchors})
    return {'app':'expresscart','commit':PIN,'tree':TREE,'files':files,
            'scope':'Static source anchors only; no behavior, authorization policy, or runtime outcome established',
            'candidate':'EC-GAP-003','decision':None,'novelty':'NOT_VERIFIED','runtime':'NOT_RUN'}

if __name__=='__main__':
    if len(sys.argv)!=2: raise SystemExit('Usage: check_ec_address.py <ExpressCart git root>')
    print(json.dumps(main(sys.argv[1]),indent=2))
