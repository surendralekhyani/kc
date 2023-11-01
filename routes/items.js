const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const dbConn  = require('../lib/db');
 
// display user page
router.get('/', function(req, res, next) {   
    dbConn.query("SELECT userrowid,menuoption FROM userrights ORDER BY userrowid", function (err, rows) {
        if (err) {
            req.flash("error", err);
            res.render('items');  
        } else {
            const nm = req.session.user;
            dbConn.query('SELECT * FROM items WHERE deleted="N" ORDER BY itemRowId desc',function(err,data)     {
                if(err) {
                    req.flash('error', err);
                    res.render('items',{data:''});   
                } else {
                    res.render('items',{'records': rows, 'data': data });
                }
            });
        }
      }); 
});

// display add item page
router.get('/add', function(req, res, next) {    
    dbConn.query("SELECT userrowid,menuoption FROM userrights ORDER BY userrowid", function (err, rows) {
        if (err) {
            req.flash("error", err);
            res.render('items');  
        } else {
            res.render('items/add', {
                itemName: '',
                sellingPrice: '',
                pp:'',
                gstRate:'',
                hsn:'',
                records: rows,
            })
        }
      }); 
})


let validateInputs = [
    check("itemName", "Name can not be blank...").trim().notEmpty().escape()
  ];

  let checkDuplicate = (itemName) => {
    return new Promise((resolve, reject) => {
      try {
        dbConn.query(
          ' SELECT * FROM `items` WHERE `itemName` = ?  ', itemName,
          function (err, rows) {
            if (err) {
              reject(err)
            }
            if (rows.length > 0) {
              resolve(true)
            } else {
              resolve(false)
            }
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  };
  
let createNewRecord = (data) => {
    return new Promise(async (resolve, reject) => {
      // check email is exist or not
      let isDuplicate = await checkDuplicate(data.itemName);
      if (isDuplicate) {
        reject(`This item "${data.itemName}" has already exist.`);
      } 
      let newRecordData = {
        itemName: data.itemName,
        sellingPrice: data.sellingPrice,
        pp: data.pp,
        gstRate: data.gstRate,
        hsn: data.hsn,
      };
  
        dbConn.query(
          ' INSERT INTO items set ? ', newRecordData,
          function (err, rows) {
            if (err) {
              reject(err)
            }
            resolve("Record Created successfully...");
          }
        );
    });
  };  

// add a new item
router.post('/add', validateInputs, async function(req, res, next) {    
    let errorsArr = [];
    let validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        let errors = Object.values(validationErrors.mapped());
        errors.forEach((item) => {
            errorsArr.push(item.msg);
        });
        req.flash("error", errorsArr);
        return res.render("items/add", {
            itemName: req.body.itemName,
            sellingPrice: req.body.sellingPrice,
            pp: req.body.pp,
            gstRate: req.body.gstRate,
            hsn: req.body.hsn
        });
    }

  //create a new item
  let newRecord = {
    itemName: req.body.itemName,
    sellingPrice: req.body.sellingPrice,
    pp: req.body.pp,
    gstRate: req.body.gstRate,
    hsn: req.body.hsn
  };
  try {
    await createNewRecord(newRecord);
    req.flash("success", "Record successfully added");
    return res.redirect("/items");
  } catch (err) {
    console.log(err);
    req.flash("error", "Some error..." + err);
    res.render("items/add", {
        itemName: req.body.itemName,
        sellingPrice: req.body.sellingPrice,
        pp: req.body.pp,
        gstRate: req.body.gstRate,
        hsn: req.body.hsn
    });
  }
})

// display edit page
router.get('/edit/(:id)', function(req, res, next) {
  dbConn.query("SELECT userrowid,menuoption FROM userrights ORDER BY userrowid", function (err, rows) {
    if (err) {
        req.flash("error", err);
        res.render('items');  
    } else {
      let id = req.params.id;
   
      dbConn.query('SELECT * FROM items WHERE itemRowId = ' + id, function(err, rowsFound, fields) {
          if(err) 
          {
              req.flash('error', 'Record not found with id = ' + RowId)
              res.redirect('/items')
          }
           
          // if Record not found
          if (rows.length <= 0) {
              req.flash('error', 'Record not found with id = ' + RowId)
              res.redirect('/items')
          }
          // if Record found
          else {
              res.render('items/edit', {
                  title: 'Edit Item', 
                  id: rowsFound[0].itemRowId,
                  itemName: rowsFound[0].itemName,
                  sellingPrice: rowsFound[0].sellingPrice,
                  pp: rowsFound[0].pp,
                  gstRate: rowsFound[0].gstRate,
                  hsn: rowsFound[0].hsn,
                  records: rows,
              })
          }
      }); // End- Select Query
    } // END - else
  }); // END - menu Query
}); // END- GET



  
let updateRecord = (data, id) => {
  return new Promise( (resolve, reject) => {
    // let isDuplicate = await checkDuplicate(data.itemName);
    // if (isDuplicate) {
    //   reject(`This item "${data.itemName}" has already exist.`);
    // } 
    console.log(id);
    let form_data = {
      itemName: data.itemName,
      sellingPrice: data.sellingPrice,
      pp: data.pp,
      gstRate: data.gstRate,
      hsn: data.hsn,
    };
        // update query
        dbConn.query('UPDATE items SET ? WHERE itemRowId = ' + id, form_data, 
          function(err, result) {
          if (err) {
            reject(err)
          }
          resolve("Record Updated successfully...");
        }
      );
  });
};  

// update data
router.post('/update/:id', validateInputs, async function(req, res, next) {
  let id = req.params.id;
  let errorsArr = [];
    let validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        let errors = Object.values(validationErrors.mapped());
        errors.forEach((item) => {
            errorsArr.push(item.msg);
        });
        req.flash("error", errorsArr);
        return res.render("items/edit", {
            itemName: req.body.itemName,
            sellingPrice: req.body.sellingPrice,
            pp: req.body.pp,
            gstRate: req.body.gstRate,
            hsn: req.body.hsn
        });
    }

  //update item
  let recordData = {
    itemName: req.body.itemName,
    sellingPrice: req.body.sellingPrice,
    pp: req.body.pp,
    gstRate: req.body.gstRate,
    hsn: req.body.hsn
  };
  try {
    await updateRecord(recordData, id);
    req.flash("success", "Record successfully updated");
    return res.redirect("/items");
  } catch (err) {
    // console.log(err);
    req.flash("error", "Some error..." + err);
    res.render("items/edit", {
        itemName: req.body.itemName,
        sellingPrice: req.body.sellingPrice,
        pp: req.body.pp,
        gstRate: req.body.gstRate,
        hsn: req.body.hsn
    });
  }
    

})
   
// delete user
router.get('/delete/(:id)', function(req, res, next) {
    let id = req.params.id;
    let form_data = {
      deleted: 'Y',
    };
        // update query
        dbConn.query('UPDATE items SET ? WHERE itemRowId = ' + id, form_data, function(err, result) {
        //if(err) throw err
        if (err) {
            // set flash message
            req.flash('error', err)
            // redirect to user page
            res.redirect('/items')
        } else {
            // set flash message
            req.flash('success', 'Record deleted successfully ! ID = ' + id)
            // redirect to user page
            res.redirect('/items')
        }
    })
})

module.exports = router;